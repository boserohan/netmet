import subprocess
import json
import os
import sys
import time
import socket
import pyasn
from scapy.layers.inet import IP, TCP, UDP
from scapy.layers.inet6 import IPv6
from scapy.all import *
from threading import Thread, Event


asndb = pyasn.pyasn('../../ipasn_21122023.dat')
pkts_pcap = []



class DnsStats:
    def __init__(self, cname_dict, ip_addr_dict, query_time, dns_server, timestamp):
        self.cname_dict = cname_dict
        self.ip_addr_dict = ip_addr_dict
        self.query_time = query_time
        self.dns_server = dns_server
        self.timestamp = timestamp

class CurlStats:
    def __init__(self, initconnect_time, appconnect_time, pretransfer_time, redirect_time, starttransfer_time, 
                 total_time, response_size, response_speed, url_effective, remote_ip, local_port, cdn_server_id_key, cdn_server_id_value):
        self.initconnect_time = initconnect_time
        self.appconnect_time = appconnect_time
        self.pretransfer_time = pretransfer_time
        self.redirect_time = redirect_time
        self.starttransfer_time = starttransfer_time
        self.total_time = total_time
        self.response_size = response_size
        self.response_speed = response_speed
        self.url_effective = url_effective
        self.remote_ip = remote_ip
        self.local_port = local_port
        self.cdn_server_id_key = cdn_server_id_key
        self.cdn_server_id_value = cdn_server_id_value

class CDNStats:
    def __init__(self, server_ip, asn_number, org_name):
        self.server_ip = server_ip
        self.asn_number = asn_number
        self.org_name = org_name

class PktSniffer(Thread):
    def  __init__(self, interface):
        super().__init__()

        self.interface = interface
        self.stop_sniffer = Event()

    def run(self):
        sniff(iface=self.interface, prn=self.process_packet, filter='src port 443 or src port 80', stop_filter=self.should_stop_sniffing)
    
    def join(self, timeout=None):
        self.stop_sniffer.set()
        super().join(timeout)
    
    def should_stop_sniffing(self, pkt):
        return self.stop_sniffer.is_set()
    
    def process_packet(self, packet):
        global pkts_pcap
        if packet.haslayer(IP) or packet.haslayer(IPv6):
            pkts_pcap.append(packet)


def readCapturedPkts(port_number):
    server_ip_set = set()

    for pkt in pkts_pcap:
        ip_layer = IP
        if pkt.haslayer(IPv6):
            ip_layer = IPv6
        if pkt.haslayer(TCP):
            if pkt[TCP].dport == port_number:
                server_ip_set.add(pkt[ip_layer].src)
        elif pkt.haslayer(UDP):
            if pkt[UDP].dport == port_number:
                server_ip_set.add(pkt[ip_layer].src)
    pkts_pcap.clear()

    return server_ip_set
                    
def getipfromiface(iface):
    result = subprocess.run(['ifconfig', iface],shell=False, capture_output=True, text=True)
    if not result.stderr and not result.returncode:
        for line in result.stdout.splitlines():
            line_words = line.split()
            if line_words[0].strip() == 'inet':
                return line_words[1].strip()
    print("No such interface available/IPv4 not configured on specified interface")

def getSection(the_string, section_name) -> []:
    try:
        the_string_iter = iter(the_string.splitlines())
        next_val = next(the_string_iter)
        while not section_name in next_val:
            next_val = next(the_string_iter)
        
        the_section_lines = [next_val,]
        next_val = next(the_string_iter)
        while next_val != "": 
            the_section_lines.append(next_val)
            next_val = next(the_string_iter)
    except Exception:
        return None
    return the_section_lines
    

def parseAnswerSection(ans_section):
    cname_dict = dict()
    ip_addr_dict = dict()
    for line in ans_section[1:]:
        words = line.split()

        if len(words) == 5:
            if words[3] == 'CNAME':
                if words[0] not in cname_dict:
                    cname_dict[words[0]] = []
                cname_dict[words[0]].append(words[-1])
            if words[3] in ['A', 'AAAA']:
                if words[0] not in ip_addr_dict:
                    ip_addr_dict[words[0]] = []
                ip_addr_dict[words[0]].append(words[-1])

    return cname_dict, ip_addr_dict

def parseQueryStatsSection(query_section):
    query_time = 0
    dns_server = ''
    for line in query_section:
        if ';; Query time:' in line:
            query_time_line = line.split()
            query_time = int(query_time_line[3])
        if ';; SERVER:' in line:
            dns_server_line = line.split()
            dns_server_list = dns_server_line[2].split('#')
            dns_server = dns_server_list[0]
        if ';; WHEN:' in line:
            timestamp_list = line.split(';; WHEN: ', 1)
            timestamp = timestamp_list[1]
    return query_time , dns_server, timestamp

def dnsResolve(domain_name,iface_addr='0.0.0.0') -> DnsStats:
    full_cmd = []
    cmd = "dig"
    full_cmd = [cmd, '-b', iface_addr, domain_name]
    cname_dict = {}
    ip_addr_dict = {}
    result = subprocess.run(full_cmd, shell=False, capture_output=True, text=True)
    if not result.stderr and not result.returncode:

        ans_section = getSection(result.stdout, "ANSWER SECTION")
        if ans_section:
            cname_dict, ip_addr_dict = parseAnswerSection(ans_section)


        query_section = getSection(result.stdout, "Query time")
        query_time, dns_server, timestamp = parseQueryStatsSection(query_section)

        return DnsStats(cname_dict,ip_addr_dict,query_time,dns_server,timestamp)
    return None


def curlWeb(domain_name, resolved_ip, iface) -> CurlStats:
    cmd = 'curl'
    domain_ip_map_80 = domain_name + ":80:" + resolved_ip
    domain_ip_map_443 = domain_name + ":443:" + resolved_ip
    output_expr = """'lookup: %{time_namelookup}\ninitconnect: %{time_connect}\nappconnect: %{time_appconnect}\npretransfer: %{time_pretransfer}\n
                      redirect: %{time_redirect}\nstarttransfer: %{time_starttransfer}\ntotal: %{time_total}\nresponsesize: %{size_download}\n
                      responsespeed: %{speed_download}\nurleffective: %{url_effective}\nremoteip: %{remote_ip}\nlocalport: %{local_port}\n'"""
    web_url = "http://" + domain_name

    full_cmd = [cmd, '--interface', iface, '-L', '-D', '-', '--fail', '--resolve',  domain_ip_map_80, '--resolve', domain_ip_map_443, '--output', '/dev/null', '--silent', '--show-error', '--write-out', output_expr, web_url]

    result = subprocess.run(full_cmd, shell=False, capture_output=True, text=True, timeout=30)

    if not result.stderr and not result.returncode:
        initconnect_time = 0
        appconnect_time = 0
        pretransfer_time = 0
        redirect_time = 0
        starttransfer_time = 0
        total_time = 0
        response_size = 0
        response_speed = 0
        url_effective = ""
        remote_ip = ""
        local_port = 0
        cdn_server_id_key = ""
        cdn_server_id_value = ""
        try:
            for line in result.stdout.splitlines():
                if 'initconnect' in line:
                    initconnect_time = float(line.split(":")[1])
                if 'appconnect' in line:
                    appconnect_time = float(line.split(":")[1])
                if 'pretransfer' in line:
                    pretransfer_time = float(line.split(":")[1])
                if 'redirect' in line:
                    redirect_time = float(line.split(":")[1])
                if 'starttransfer' in line:
                    starttransfer_time = float(line.split(":")[1])
                if 'total' in line:
                    total_time = float(line.split(":")[1])
                if 'responsesize' in line:
                    response_size = float(line.split(":")[1])
                if 'responsespeed' in line:
                    response_speed = float(line.split(":")[1])
                if 'urleffective' in line:
                    url_effective = line.split(":",1)[1].strip()
                if 'remoteip' in line:
                    remote_ip = line.split(":",1)[1].strip()
                if 'localport' in line:
                    local_port_str = line.split(":",1)[1].strip()
                    if local_port_str.isdigit():
                        local_port = int(local_port_str)
                if 'cf-ray'.casefold() in line.casefold():
                    cdn_server_id_key = 'cf-ray'
                    cdn_server_id_value = line.split(":",1)[1].strip()
                if 'x-amz-cf-pop'.casefold() in line.casefold():
                    cdn_server_id_key = 'x-amz-cf-pop'
                    cdn_server_id_value = line.split(":",1)[1].strip()

        except Exception as e:
            print(f"Error parsing curl o/p: {e}")
        finally:
            return CurlStats(initconnect_time,appconnect_time,pretransfer_time,
                         redirect_time,starttransfer_time,total_time,response_size,
                         response_speed,url_effective,remote_ip,local_port, cdn_server_id_key, cdn_server_id_value)
    else:
        print(result.stderr)
        return None

def getASNdetails(ip_addr):
    result_asn = asndb.lookup(ip_addr)
    asn_number = result_asn[0]
    org_name = ""
    whois_query = ['whois', '-h', 'whois.arin.net']
    if asn_number:
        whois_query.append(str(asn_number))
    else:
        whois_query.append(ip_addr)
    result_whois = subprocess.run(whois_query,shell=False, capture_output=True, text=True)

    as_whois = ""
    if not result_whois.stderr and not result_whois.returncode:
        for line in result_whois.stdout.splitlines():
            if 'OrgName' in line:
                org_name = line.split(":",1)[1].strip()
            if 'OriginAS' in line:
                as_whois = line.split(":",1)[1].strip()
    
    if asn_number is None:
        try:
            if 'AS' in as_whois:
                asn_number = int(as_whois[2:])
            else:
                asn_number = int(as_whois)
        except Exception as e:
            pass
    return asn_number, org_name

def main():
    print("Starting DNS measurements")
    print("Enter interface name from which to run the measurements:")
    iface = input()
    iface_addr = getipfromiface(iface)

    output_filename = "dns_msm_stats.json"
    domain_list = []
    with open('domains_complete.json') as domain_file:
        domain_list = json.load(domain_file)


    all_domain_dict = {}
    if not os.path.isfile(output_filename):
        with open(output_filename, "w") as file:
            json.dump(all_domain_dict,file)
    else:
        with open(output_filename, "r") as file:
            all_domain_dict = json.load(file)

    domain_set = set(domain_list)
    website_set = set(all_domain_dict.keys())
    outstanding_domain_list = domain_set - website_set
    pkt_sniffer = None

    i = 0
    progress_bar_len = 50

    for domain_name in outstanding_domain_list:
        try:
            percent = 100.0*(float(i)/len(outstanding_domain_list))
            sys.stdout.write('\r')
            sys.stdout.write("Completed: [{:{}}] {:>3}%"
                            .format('='*int(percent/(100.0/progress_bar_len)),
                                    progress_bar_len, int(percent)))
            sys.stdout.flush()
            if iface_addr:
                dns_stats = dnsResolve(domain_name,iface_addr)
            else:
                dns_stats = dnsResolve(domain_name)
            curl_stats_dict = {}
            dns_stats_dict = {}
            cdn_stats_dict = {}
            if dns_stats:
                dns_stats_dict = dns_stats.__dict__

                for ip_addr_list in dns_stats.ip_addr_dict.values():
                    all_server_ips = []
                    for ip_addr in ip_addr_list:
                        pkt_sniffer = PktSniffer(iface)
                        pkt_sniffer.start()
                        time.sleep(1)
                        curl_stats = curlWeb(domain_name, ip_addr, iface)

                        pkt_sniffer.join(timeout=3)
                        if curl_stats:
                            curl_stats_dict[ip_addr] = curl_stats.__dict__
                        if curl_stats.local_port:
                            all_server_ips = readCapturedPkts(curl_stats.local_port)

                            for server_ip_addr in set(all_server_ips):

                                asn, orgname = getASNdetails(server_ip_addr)
                                cdn_stats_dict[ip_addr] = CDNStats(server_ip=server_ip_addr,asn_number=asn,org_name=orgname).__dict__

            all_domain_dict[domain_name] = {}
            all_domain_dict[domain_name]['dns'] = dns_stats_dict
            all_domain_dict[domain_name]['curl'] = curl_stats_dict
            all_domain_dict[domain_name]['cdn'] = cdn_stats_dict

            i = i + 1  
        except Exception as e:
            print(f"\nMain Thread Exception: {e}")
            if pkt_sniffer:
                pkt_sniffer.join(timeout=1)
            if domain_name in all_domain_dict:
                del all_domain_dict[domain_name]
            continue

    with open(output_filename, "w") as output_file:
        website_json = json.dumps(all_domain_dict, indent=4)
        output_file.write(website_json)
    sys.stdout.write('\r')
    sys.stdout.write("Completed: [{:{}}] {:>3}%"
                        .format('='*int(100/(100.0/progress_bar_len)),
                                progress_bar_len, 100))
    sys.stdout.flush()
    
if __name__ == '__main__':
    main()