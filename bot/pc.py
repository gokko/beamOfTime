from flask import *
from threading import Thread

import time
import os
import urllib.request
import json
import signal

#from clock.botclock import BotClock
#from clock.botAnimations import * 

app = Flask(__name__)
configFolder = './clock'
global clock

@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
    return send_from_directory('.', 'index.html')
    
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path, mimetype="application/javascript")

@app.route('/favicon.ico')
def send_favicon():
    return send_from_directory('files', 'favicon.ico', mimetype="image/x-icon")

@app.route('/version/<path:path>')
def send_version(path):
    data= ''
    if path == 'local':
        data= send_from_directory('./', 'version.json', mimetype="application/json")
    if path == 'remote':
        u= 'https://raw.githubusercontent.com/gokko/beamOfTime/master/bot/version.json'
        with urllib.request.urlopen(u) as url:
            data = json.loads(url.read().decode())
    return data

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path, mimetype="text/css")

@app.route('/i18n/<path:path>')
def send_i18n(path):
    # check if translation for requested language exists
    if (os.path.isfile('i18n/'+ path)):
        return send_from_directory('i18n', path)
    # if not, return en-US
    else:
        return send_from_directory('i18n', 'en-US.json')

@app.route('/files/<path:path>')
def send_files(path):
    return send_from_directory('files', path)

@app.route('/fonts/<path:path>')
def send_webfonts(path):
    return send_from_directory('fonts', path)

@app.route('/pages/<path:path>')
def send_pages(path):
    return send_from_directory('pages', path, mimetype="application/javascript")

@app.route('/version', methods = ['GET'])
def get_version():
    return send_from_directory('./', 'version.json', mimetype="application/json")

@app.route('/config', methods = ['GET'])
def get_config():
    return send_from_directory(configFolder, 'config.json', mimetype="application/json")

@app.route('/config', methods = ['POST'])
def send_config():
    conf = json.dumps(json.loads(request.data), indent=4)
    tmpFile = os.path.join(configFolder, 'config-new.json')
    confFile = os.path.join(configFolder, 'config.json')
    # create temporary file
    with open(tmpFile, 'w') as f:
        f.write(conf)
    # rename when done writing
    os.remove(confFile);
    os.rename(tmpFile, confFile)
    return 'OK'

@app.route('/restart', methods = ['POST'])
def send_restart():
    tmpFile = os.path.join(configFolder, 'restart-new.req')
    restartFile = os.path.join(configFolder, 'restart.req')
    # create temporary file
    with open(tmpFile, 'wb') as f:
        f.write(request.data)
    # rename when done writing
    os.rename(tmpFile, restartFile)
    return 'OK'


if __name__ == '__main__':
    #clock = BotClock()
    #t = Thread(target=clock.run, args=())
    #t.start()
    app.run(debug=False, host='0.0.0.0', port=int("80"))
    
    #clock.stop()
    
    