import subprocess
import json
import time
import sys

class HopDetails:
    def __init__(self, hop_alias, hop_ip, hop_rtt):
        self.hop_alias = hop_alias
        self.hop_ip = hop_ip
        self.hop_rtt = hop_rtt

class TracerouteHop:
    def __init__(self, hop_number, hop_details):
        self.hop_number = hop_number
        self.hop_details = hop_details

class TracerouteStats:
    def __init__(self, target_ip, start_timestamp, end_timestamp, hops):
        self.target_ip = target_ip
        self.start_timestamp = start_timestamp
        self.end_timestamp = end_timestamp
        self.hops = hops

def getipfromiface(iface):
    result = subprocess.run(['ifconfig', iface],shell=False, capture_output=True, text=True)
    if not result.stderr and not result.returncode:
        for line in result.stdout.splitlines():
            line_words = line.split()
            if line_words[0].strip() == 'inet':
                return line_words[1].strip()
    print("No such interface available/IPv4 not configured on specified interface")
    return None

def extractTracerouteHop(traceroute_line):
    hop_details = []
    if traceroute_line.count('*') != 3:
        values = traceroute_line.strip().split()
        if not values[0].isdigit():
            return None
        hop_number = values[0]
        one_ping = []
        for value in values[1:]:
            if value == "*":
                hop_details.append(HopDetails('*','*','*').__dict__)
            elif value == "ms":
                if len(one_ping) == 3:
                    if one_ping[-1].replace(".","").isnumeric():
                        hop_details.append(HopDetails(hop_alias=one_ping[0],hop_ip=one_ping[1].strip("()"),hop_rtt=one_ping[2]).__dict__)
                    else:
                        hop_details.append(HopDetails('*','*','*').__dict__)
                if len(one_ping) == 1:
                    if one_ping[-1].replace(".","").isnumeric():
                        last_hop_details = hop_details[-1]
                        hop_details.append(HopDetails(hop_alias=last_hop_details['hop_alias'],hop_ip=last_hop_details['hop_ip'],hop_rtt=one_ping[0]).__dict__)
                    else:
                        hop_details.append(HopDetails('*','*','*').__dict__)
                one_ping.clear()
            else:
                one_ping.append(value)
        return TracerouteHop(hop_number=hop_number,hop_details=hop_details)

def runTraceroute(iface, target_list):
    cmd = ['traceroute', '-i', iface]
    traceroute_list = []
    i = 0
    progress_bar_len = 50
    try:
        for ip in target_list:
            percent = 100.0*(float(i)/len(target_list))
            sys.stdout.write('\r')
            sys.stdout.write("Completed: [{:{}}] {:>3}%"
                            .format('='*int(percent/((100.0/progress_bar_len))),
                                    progress_bar_len, int(percent)))
            sys.stdout.flush()
            i = i + 1
            start_timestamp = int(time.time())
            result = subprocess.run(cmd + [ip,],shell=False, capture_output=True, text=True)
            end_timestamp = int(time.time())
            if result.stdout:
                hops = []
                traceroute_line = ""
                for line in result.stdout.splitlines():
                    new_hop = False
                    values = line.split()
                    if values[0].isdigit():
                        new_hop = True
                    if new_hop == True:
                        if traceroute_line != "":
                            traceroute_hop = extractTracerouteHop(traceroute_line)
                            if traceroute_hop is not None:
                                hops.append({
                                    'hop_number': traceroute_hop.hop_number,
                                    'hop_details': traceroute_hop.hop_details
                                })
                        traceroute_line = ""
                    traceroute_line += line
                if traceroute_line != "":
                    traceroute_hop = extractTracerouteHop(traceroute_line)
                    if traceroute_hop is not None:
                                hops.append({
                                    'hop_number': traceroute_hop.hop_number,
                                    'hop_details': traceroute_hop.hop_details
                                })
                traceroute_result = TracerouteStats(target_ip=ip,start_timestamp=start_timestamp,end_timestamp=end_timestamp,hops=hops)
                traceroute_list.append(traceroute_result.__dict__)
            else:
                print(f"ERROR: {result.stderr}")
    except (KeyboardInterrupt, Exception) as e:
        print(e)
        

    percent = 100.0*(float(i)/len(target_list))
    sys.stdout.write('\r')
    sys.stdout.write("Completed: [{:{}}] {:>3}%"
                    .format('='*int(percent/(100.0/progress_bar_len)),
                            progress_bar_len, int(percent)))
    sys.stdout.flush()
    return traceroute_list

def main():
    print("Starting Traceroute measurements")
    print("Enter interface name from which to run the measurements:")
    iface = input()

    iface_addr = getipfromiface(iface)
    if iface_addr is None:
        sys.exit()
    start_time = int(time.time())
    ip_list = ['54.241.138.59', '13.245.232.79', '13.208.212.242', '3.26.200.220','3.70.191.175', '18.228.58.142'] * 10
    traceroute_list = runTraceroute(iface, ip_list)
    
    with open(f'traceroute_msm_stats_{start_time}.json', 'w+') as output_file:
        json.dump(traceroute_list,output_file,indent=2)
        
if __name__ == '__main__':
    main()