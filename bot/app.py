
import os
import sys
import time
import json
import glob
import stat
import atexit
import ifaddr
import signal
import socket
import shutil
import platform
import urllib.request
from flask import Flask, request, jsonify, send_from_directory
from threading import Thread
from subprocess import call, Popen, PIPE, STDOUT
from wpasupplicantconf import WpaSupplicantConf

# check if this script is running on a raspberry pi (Linux with arm processor)
isRaspi= (platform.system() == 'Linux' and platform.machine()[0:3] == 'arm')

# only load the clock if it's running on the raspberry pi
if isRaspi:
    from clock.botclock import BotClock
    from clock.botAnimations import *

app = Flask(__name__)
clock = None
rootFolder = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
bkupFolder= os.path.dirname(rootFolder)+ '/.bkup'
webFolder = rootFolder+ '/bot'
i18nFolder = webFolder+ '/i18n/'
clockFolder = rootFolder+ '/bot/clock'
wifiFolder = '/etc/wpa_supplicant/'
# if script is not running on raspi, use the local version of wpa_supplicant.conf file
if not isRaspi:
    wifiFolder= rootFolder+ '/raspi-setup'

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

@app.route('/i18n')
def send_i18n():
    # combine all languages into one file
    res= {}
    for subdir, dirs, files in os.walk(i18nFolder):
        for dir in dirs:
            file= i18nFolder+ '/'+ dir+ '/translations.json'
            if not os.path.isfile(file):
                continue
            with open(file, 'rb') as f:
                js = json.load(f)
                res[dir]= {'translation': js}

    return jsonify(res)

@app.route('/files/<path:path>')
def send_files(path):
    return send_from_directory(webFolder+ '/files', path)

@app.route('/fonts/<path:path>')
def send_webfonts(path):
    return send_from_directory(webFolder+ '/fonts', path)

@app.route('/pages/<path:path>')
def send_pages(path):
    return send_from_directory(webFolder+ '/pages', path, mimetype="application/javascript")

@app.route('/info', methods = ['GET'])
def get_info():
    res= {}
    # if backup exists add backup date
    bkupTime= ''
    file= bkupFolder+ '/info.txt'
    if os.path.isfile(file):
        if platform.system() == 'Windows':
            bkupTime= time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(os.path.getmtime(file)))
        else:
            stat = os.stat(file)
            bkupTime= time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(stat.st_mtime))

    res['backup_time']= bkupTime

    # add hostname 
    res['hostname']= socket.gethostname()

    # add all ip addresses
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
    res['ips']= ipaddresses
    return  jsonify(res)

@app.route('/wifi', methods = ['GET'])
def get_wifi():
    f= open(wifiFolder+ '/wpa_supplicant.conf', 'r')
    wpaConf= f.read()
    f.close()
    wifi = WpaSupplicantConf(wpaConf)
    res= wifi.toJsonDict()
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

def handleFileError(func, path, exc_info):
    # Check if file access issue
    if not os.access(path, os.W_OK):
       # Try to change the permision of file
       os.chmod(path, stat.S_IWUSR)
       # call the calling function again
       func(path)

@app.route('/backup')
def send_backup():
    # skip backup if not running on raspi
    if not isRaspi:
        return 'OK (backup skipped)'
    try:
        shutil.rmtree(bkupFolder, onerror=handleFileError)
        os.mkdir(bkupFolder)
        shutil.copytree(rootFolder, bkupFolder+ '/beamOfTime')
        shutil.copy(wifiFolder+ '/wpa_supplicant.conf', bkupFolder)
        f= open(bkupFolder+ '/info.txt', 'w')
        f.close()
    except OSError as e:
        return 'Error: %s' % e

    return 'OK'

@app.route('/restore')
def send_restore():
    # skip restore if not running on raspi
    if not isRaspi:
        return 'OK (restore skipped)'
    if not os.path.isdir(bkupFolder+ '/beamOfTime') or not os.path.isfile(bkupFolder+ '/beamOfTime/bot/app.py') or not os.path.isfile(bkupFolder+ '/wpa_supplicant.conf'):
        return 'no valid backup found'
    try:
        os.remove(wifiFolder+ '/wpa_supplicant.conf')
        shutil.copy(bkupFolder+ '/wpa_supplicant.conf', wifiFolder)
        shutil.rmtree(rootFolder, onerror=handleFileError)
        shutil.copytree(bkupFolder+ '/beamOfTime', rootFolder)
    except OSError as e:
        return 'Error: %s' % e

    call(['sudo', 'service', 'bot', 'restart'])
    return 'OK'

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
    # skip restart if not running on raspi
    if not isRaspi:
        return 'OK (restart skipped)'

    # client is not expecting any result, as service can't responde due to restart
    if (path.lower() == 'reboot'):
        call(['sudo', 'reboot'])
    elif (path.lower() == 'restart'):
        call(['sudo', 'service', 'bot', 'restart'])
    return path+ ' OK'


# handle exit request
def sigterm_handler(_signo, _stack_frame):
    print("bot clock service is going to stop")
    if isRaspi:
        clock.stop()
    sys.exit(0)

if __name__ == '__main__':
    # handle SIGTERM to gracefully stop clock
    signal.signal(signal.SIGTERM, sigterm_handler)

    # only start clock if running on raspi
    if isRaspi:
        clock = BotClock()
        t = Thread(target=clock.run, args=())
        t.start()

    app.config['JSON_AS_ASCII'] = False
    app.run(debug=False, host='0.0.0.0', port=int("80"))
    
    # stop clock if running on raspi
    if isRaspi:
        clock.stop()

    