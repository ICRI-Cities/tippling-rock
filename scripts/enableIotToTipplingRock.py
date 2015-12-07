#
# enableIotToTipplingRock.py
#
# Script to pull down information from EnableIoT via REST and write into nodes.internal.json, the
# format needed for Tippling Rock
#
# Michael Rosen
# mrrosen
# 14-09-2015
#

import json
import time
import math
import datetime
import os

import requests

ONEDAY = 24 * 3600 * 1000;

# Some important functions
def checkCode(resp, expected, kill=False):
  if (resp.status_code == expected):
    return;
  print(" ERROR: Response did not complete successfully, got code %d, expected code %d" % (resp.status_code, expected));

  if (kill):
    exit(0);

def getSensorData(comp, t, i):
    req = {};
    req['from'] = -1209600;
    req['targetFilter'] = {'deviceList': [comp['d_id']]};
    req['metrics'] = [{'id': comp['cid'], 'op': "none"}];

    header = authHeader(t);
    header['content-type'] = "application/json";

    resp = requests.post(baseURL() + requestDataURL(i), json=req, headers=header);

    return json.loads(resp.text);

def getUnits(comp, l):
    for i in l:
        if (comp['type'] == i['id']):
            return i['measureunit'];
    return 'Units';

def isActuator(comp, l):
    for i in l:
        if ((comp['type'] == i['id']) and (i['type'] == "actuator")):
            return True;
    return False;

def authHeader(t):
    return {'Authorization': "Bearer " + t};

def getTime():
    return int(round(time.time() * 1000));

# Convert datetime object to timestamp
def epochTime(dt):
    return int((dt - datetime.datetime(1970, 1, 1)).total_seconds() * 1000);

# Provide key for sorting
def sortFunc(k):
    return k['ts'];

# Import function to convert a time into an index into the lifebar
def calcLifebarIndex(t):
  d = datetime.datetime.utcfromtimestamp(int(t / 1000));
  startOfCurrentDay = epochTime(lastUpdate) - (epochTime(lastUpdate) % ONEDAY);
  startOfTDay = t - (t % ONEDAY);
  diff = (startOfCurrentDay - startOfTDay) / ONEDAY;
  return d.hour + ((13 - diff) * 24);

print("Starting up....");

# Set a bunch of needed parameters
def baseURL():
    return "https://dashboard.us.enableiot.com/v1/api";
def accountsURL(i):
    return "/accounts/" + i;
def authURL():
    return "/auth/token";
def deviceListURL(i):
    return accountsURL(i) + "/devices";
def componentTypeURL(i):
    return accountsURL(i) + "/cmpcatalog?full=true";
def requestDataURL(i):
    return accountsURL(i) + "/data/search";

print("Reading from JSON config file...");
config = json.load(open("config.json", "r"));
aIDs = config['accountIDs'];

print("Getting token from enableiot.com...");
authReq = {'username': config['username'], 'password': config['password']};
authResp = requests.post(baseURL() + authURL(), json=authReq);
checkCode(authResp, 200, True);

token = json.loads(authResp.text)['token'];

print("Successfully received token!");

nodes = {'nodes': []};

for aID in aIDs:
  print("Processing account %s" % aID);
  
  accountInfoHeader = authHeader(token);
  accountInfoResp = requests.get(baseURL() + accountsURL(aID), headers=accountInfoHeader);
  checkCode(accountInfoResp, 200);
  
  accountInfo = json.loads(accountInfoResp.text);

  print("Getting list of devices...");
  deviceListHeader = authHeader(token);
  deviceListResp = requests.get(baseURL() + deviceListURL(aID), headers=deviceListHeader);
  checkCode(deviceListResp, 200);

  devices = json.loads(deviceListResp.text);

  print("Got devices!");

  print("Getting component type list...");
  componentTypeHeader = authHeader(token);
  componentTypeResp = requests.get(baseURL() + componentTypeURL(aID), headers=componentTypeHeader);
  checkCode(componentTypeResp, 200);

  cmpTypes = json.loads(componentTypeResp.text);

  print("Got component type list!");

  for device in devices:
      print("  Processing Node: %s" % device['deviceId']);
      t = getTime();
      
      node = {};
      node['name'] = device['name'];
      node['id'] = device['deviceId'];
      if ("Site" in device['attributes']):
        node['site'] = device['attributes']['Site'];
      else:
        node['site'] = "notspecified"; 
      node['project'] = accountInfo['name'];
      node['hardware'] = device['attributes']['Model Name'];
      node['deployed'] = device['created'];
      node['lastUpdate'] = t;
      node['long'] = device['loc'][1];
      node['lat'] = device['loc'][0];

      node['sensors'] = [];

      if ("components" in device):
        for comp in device['components']:
            if (isActuator(comp, cmpTypes)):
                print("    Component %s is of type actuator, skipping..." % comp['cid']); 
                continue;
            
            print("    Processing Sensor: %s" % comp['cid']);
            sensor = {};
            sensor['id'] = comp['cid'];
            sensor['name'] = comp['name'];
            sensor['units'] = getUnits(comp, cmpTypes);
            sensor['type'] = comp['type'];

            data = getSensorData(comp, token, aID);
            sensor['data'] = [];

            if (len(data['series']) > 0):
                for p in data['series'][0]['points']:
                    sensor['data'].append({'ts': int(p['ts']), 'value': float(p['value'])});

            node['sensors'].append(sensor);
      
      nodes['nodes'].append(node);

print("Done creating nodes, dumping for reference...");

json.dump(nodes, open("nodes.json", "w"));

print("Moving on....");

lastUpdate = datetime.datetime.utcnow();
nodesInternal = {'lastUpdate': epochTime(lastUpdate), 'nodes': []};

for n in nodes['nodes']:
    print("Processing %s" % n['name']);

    n['lifebar'] = [];
    for i in xrange(24 * 13 + lastUpdate.hour + 1):
        n['lifebar'].append(0);

    n['samples24'] = 0;
    
    for s in n['sensors']:
        print(s['name']);

        s['data'].sort(key=sortFunc);
        s['chartData'] = [];

        numToAvg = math.ceil(len(s['data']) / 50.0);
        avgVal = 0;
        avgCount = 0;
        avgTS = 0;

        for pt in s['data']:
            lifebarIndex = calcLifebarIndex(pt['ts']);
            if (lifebarIndex >= 0):
                n['lifebar'][lifebarIndex] = 1;
            if (pt['ts'] >= (epochTime(lastUpdate) - ONEDAY)):
                n['samples24'] += 1;
                
            avgVal += pt['value'];
            avgTS += pt['ts'];
            avgCount += 1;
            if (avgCount == numToAvg):
              avgVal /= avgCount;
              avgTS /= avgCount;
              s['chartData'].append({'x': avgTS, 'y': avgVal});
              avgVal = 0;
              avgTS = 0;
              avgCount = 0;
              
        # Add in the remaining
        if (avgCount > 0):
            avgVal /= avgCount;
            avgTS /= avgCount
            s['chartData'].append({'x': avgTS, 'y': avgVal});

        s['data'] = [];
    nodesInternal['nodes'].append(n);
    
print("Dumping to nodes.internal.json...");
  
json.dump(nodesInternal, open(os.path.expanduser(config['savePath'] + "/nodes.internal.json"), "w"));

print("Done!");

