
import os
import time
import json
import glob
import ifaddr
import signal
import socket
import platform
import urllib.request
from flask import Flask, request, jsonify, send_from_directory
from threading import Thread
from subprocess import call, Popen, PIPE, STDOUT
from wpasupplicantconf import WpaSupplicantConf

# class to watch kill events
class GracefulKiller:
  kill_now = False
  def __init__(self):
    signal.signal(signal.SIGINT, self.exit_gracefully)
    signal.signal(signal.SIGTERM, self.exit_gracefully)

  def exit_gracefully(self,signum, frame):
    self.kill_now = True 
    if clock:
        clock.stop()


# check if this script is running on a raspberry pi (Linux with arm processor)
isRaspi= (platform.system() == 'Linux' and platform.machine()[0:3] == 'arm')

# only load the clock if it's running on the raspberry pi
if isRaspi:
    from clock.botclock import BotClock
    from clock.botAnimations import *

app = Flask(__name__)
rootFolder = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
webFolder = rootFolder+ '/bot'
i18nFolder = webFolder+ '/i18n/'
clockFolder = rootFolder+ '/bot/clock'
wifiFolder = '/etc/wpa_supplicant/'
# if script is not running on raspi, use the local version of wpa_supplicant.conf file
if not isRaspi:
    wifiFolder= rootFolder+ '/raspi-setup'

global clock

@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
    return send_from_directory(webFolder, 'index.html')
    
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory(webFolder+ '/js', path, mimetype="application/javascript")

@app.route('/favicon.ico')
def send_favicon():
    return send_from_directory(webFolder+ '/files', 'favicon.ico', mimetype="image/x-icon")

@app.route('/version/<path:path>')
def get_version(path):
    data= ''
    if path == 'local':
        data= send_from_directory(webFolder, 'version.json', mimetype="application/json")
    if path == 'remote':
        u= 'https://raw.githubusercontent.com/gokko/beamOfTime/master/bot/version.json'
        with urllib.request.urlopen(u) as url:
            data = url.read().decode()
    return data

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory(webFolder+ '/css', path, mimetype="text/css")

@app.route('/i18n/<path:path>')
def send_i18n(path):
    # check if translation for requested language exists
    if (os.path.isfile(i18nFolder+  path)):
        return send_from_directory(i18nFolder, path, mimetype="application/json")
    # if not, return English
    else:
        return send_from_directory(i18nFolder, 'en-US.json', mimetype="application/json")

@app.route('/files/<path:path>')
def send_files(path):
    return send_from_directory(webFolder+ '/files', path)

@app.route('/fonts/<path:path>')
def send_webfonts(path):
    return send_from_directory(webFolder+ '/fonts', path)

@app.route('/pages/<path:path>')
def send_pages(path):
    return send_from_directory(webFolder+ '/pages', path, mimetype="application/javascript")

@app.route('/wifi', methods = ['GET'])
def get_wifi():
    wpaConf= open(wifiFolder+ '/wpa_supplicant.conf', 'r').read()
    wifi = WpaSupplicantConf(wpaConf)
    res= wifi.toJsonDict()
    # add hostname and all ip addresses
    ipconf= {}
    ipconf['hostname']= socket.gethostname()
    ipaddresses= []
    adapters = ifaddr.get_adapters()
    for adapter in adapters:
        aName= adapter.nice_name.lower()
        for ip in adapter.ips:
            # cleanup adapter names on windows 
            aName= aName.replace('intel(r) ', '')
            aName= aName.replace('dual band wireless-ac', 'wifi')
            aName= aName.replace('ethernet connection ', 'eth')
            # exclude 'internal' adapters
            if type(ip.ip) == str and aName!= 'lo' and not 'virtual' in aName and not 'loopback' in aName and not 'bluetooth' in aName:
                ipaddresses.append({'name': aName, 'ip': ip.ip})
    ipconf['ips']= ipaddresses
    res['ipconf']= ipconf
    return  jsonify(res)

@app.route('/wifi', methods = ['POST'])
def send_wifi():
    wpaJson= json.loads(request.data)
    # remove ipconf key, as it's for UI only
    wpaJson.pop('ipconf', '')
    wifi = WpaSupplicantConf(wpaJson)
    wpaFilename= wifiFolder+ '/wpa_supplicant.conf'
    wifi.write(wpaFilename)
    # restart wifi service
    if isRaspi:
        call(['sudo', 'systemctl', 'daemon-reload'])
        call(['sudo', 'systemctl', 'restart', 'dhcpcd'])
    return 'OK'

@app.route('/config', methods = ['GET'])
def get_config():
    res= {}
    with open(clockFolder+ '/config.json', 'rb') as f:
        res = json.load(f)
    languages= []
    for file in glob.glob(i18nFolder + '*.json'):
        langCode = os.path.basename(os.path.splitext(file)[0])
        langName= ''
        with open(file, 'rb') as f:
            langContent = json.load(f)
            langName= langContent['language_name']
        languages.append({"value": langCode, "text": langName})
    res['languages']= languages

    return jsonify(res)

@app.route('/update')
def send_update():
    res= Popen(['git', '-C', rootFolder, 'pull', 'origin', 'master'], stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
    return res.stdout.read()

@app.route('/config', methods = ['POST'])
def send_config():
    conf = json.dumps(json.loads(request.data), indent=4, ensure_ascii=False).encode('utf8')
    tmpFile = os.path.join(clockFolder, 'config-new.json')
    confFile = os.path.join(clockFolder, 'config.json')
    # create temporary file
    with open(tmpFile, 'wb') as f:
        f.write(conf)
    # rename when done writing
    if os.path.exists(confFile):
        os.remove(confFile)
    os.rename(tmpFile, confFile)
    return 'OK'

@app.route('/restart/<path:path>')
def send_restart(path):
    # client is not expecting any result, as service can't responde due to restart
    if not isRaspi:
        return 'OK (not restarted)'

    if (path.lower() == 'reboot'):
        call(['sudo', 'reboot'])
    elif (path.lower() == 'restart'):
        call(['sudo', 'service', 'bot', 'restart'])
    return path+ ' OK'

if __name__ == '__main__':
    killer = GracefulKiller()

    if isRaspi:
        clock = BotClock()
        t = Thread(target=clock.run, args=())
        t.start()

    app.config['JSON_AS_ASCII'] = False
    app.run(debug=False, host='0.0.0.0', port=int("80"))
    
    if isRaspi:
        clock.stop()

    