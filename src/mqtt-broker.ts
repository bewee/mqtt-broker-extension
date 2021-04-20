/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import {Config} from './config';
import {AddonManagerProxy} from 'gateway-addon';
import fs from 'fs';
import path from 'path';
import {TlsOptions} from 'tls';
import createAedes, {Aedes, AedesOptions} from 'aedes';
import aedes from 'aedes-server-factory';

export class MQTTBroker {

  private aedes: Aedes;

  private tlsOptipons: TlsOptions;

  // eslint-disable-next-line no-unused-vars
  constructor(private addonManager: AddonManagerProxy, private config: Config) {
    this.tlsOptipons = this.initializeTLSOptions();
    this.aedes = this.initializeAedes();
    this.initializeServers();
  }

  initializeTLSOptions(): TlsOptions {
    let options = {};
    if (
      this.config.mqtts && this.config.mqtts.enabled ||
      this.config.mqttwss && this.config.mqttwss.enabled
    ) {
      const dataDir = (this.addonManager as any).userProfile.dataDir;
      const p = path.join(dataDir, 'mqtt-broker-extension');
      options = {
        key: fs.readFileSync(path.join(p, 'server.key')),
        cert: fs.readFileSync(path.join(p, 'server.crt')),
      };
    }
    return options;
  }

  private initializeAedes() {
    const options: AedesOptions = {};
    try {
      Object.assign(options, JSON.parse(this.config.customBrokerConfig!));
    // eslint-disable-next-line no-empty
    } catch (ex) {}
    if (this.config.brokerId) {
      options.id = this.config.brokerId;
    }

    return createAedes(options);
  }

  initializeServers(): void {
    if (this.config.mqtt && this.config.mqtt.enabled) {
      const server = aedes.createServer(this.aedes);
      server.listen(this.config.mqtt.port, () => {
        console.info('MQTT broker (mqtt) running!');
      });
    }

    if (this.config.mqtts && this.config.mqtts.enabled) {
      const server = aedes.createServer(this.aedes, {tls: this.tlsOptipons});
      server.listen(this.config.mqtts.port, () => {
        console.info('MQTT broker (mqtts) running!');
      });
    }

    if (this.config.mqttws && this.config.mqttws.enabled) {
      const server = aedes.createServer(this.aedes, {ws: true});
      server.listen(this.config.mqttws.port, () => {
        console.info('MQTT broker (mqttws) running!');
      });
    }

    if (this.config.mqttwss && this.config.mqttwss.enabled) {
      const server = aedes.createServer(
        this.aedes,
        {ws: true, tls: this.tlsOptipons},
      );
      server.listen(this.config.mqttwss.port, () => {
        console.info('MQTT broker (mqttwss) running!');
      });
    }
  }
}
