
 Starlink Web Measurements
---
This repo contains test scripts for DNS and CDN measurements. The DNS folder contains these scripts. The Plugin folder contains the code for the chrome extension.

# Requirements
- python3
- dig
- traceroute
``` sh
sudo apt-get install dnsutils traceroute python3 python3-pip
```
Install the python dependencies.
``` sh
pip install -r requirements.txt
```
# Running the script
1. Start the DNS measurements:
    - `cd DNS/scripts`
    - `python3 starlink_dns_msm.py`
2. Start the Traceroute measurements:
    - `cd DNS/scripts`
    - `python3 starlink_traceroute.py`


# TODO
Plugin docs