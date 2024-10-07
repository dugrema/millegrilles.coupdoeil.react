import '@solana/webcrypto-ed25519-polyfill';
import { expose } from 'comlink';
import { ConnectionWorker, MessageResponse, SubscriptionCallback, SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import apiMapping from './apiMapping.json';
import { messageStruct, keymaster, encryption } from 'millegrilles.cryptography';

const DOMAINE_CORETOPOLOGIE = 'CoreTopologie';
const DOMAINE_COREPKI = 'CorePki';
const DOMAINE_CORECATALOGUES = 'CoreCatalogues';
const DOMAINE_MAITREDESCLES = 'MaitreDesCles';
const DOMAINE_FICHIERS = 'fichiers';
const DOMAINE_INSTANCE = 'instance';

// export type SendChatMessageCommand = { 
//     conversation_id: string,
//     model: string, 
//     role: string, 
//     encrypted_content: EncryptionBase64Result,
//     new?: boolean,
// };

// export type ActivationCodeResponse = MessageResponse & {
//     code?: number | string,
//     csr?: string,
//     nomUsager?: string,
// };

export type Domain = {
    domaine: string,
    instance_id: string | null,
    creation?: number | null,
    presence?: number | null,
    reclame_fuuids?: boolean | null,
};

export type ResponseGetDomainList = MessageResponse & {
    resultats: Array<Domain>,
};

export type DomaineEventCallback = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & {
        domaine: string,
        primaire?: boolean | null,
        reclame_fuuids?: boolean | null,
        instance_id?: string | null,
    },
};

export type DomainBackupInformation = MessageResponse & {
    domaine: string,
    concatene?: {
        date: number,
        version: string,
    },
    nombre_transactions?: number,
    transaction_plus_recente?: number,
    cles?: {[key: string]: keymaster.DomainSignature}
};

export type ResponseGetDomainBackupInformation = MessageResponse & {
    backups: Array<DomainBackupInformation>,
};

export type ResponseGetNonDecryptableKeyBatch = MessageResponse & {
    cles?: Array<{cle_id: string, signature: keymaster.DomainSignature}>,
    idx?: number,
};

export type ServerInstance = {
    instance_id: string,
    applications_configurees: ApplicationConfiguree[],
    date_presence: number,
    containers: any,
    disk: any,
    domaine?: string,
    domaines?: string[],
    fqdn_detecte?: string,
    hostname: string,
    info?: any,
    ip_detectee?: string,
    load_average: number[],
    securite?: string,
    services?: any,
    system_battery?: any,
    system_fans?: any,
    system_temperature?: any,
    webapps?: InstanceWebApp[],
}

export type ApplicationConfiguree = {
    nom: string,
    version: string
};

export type InstanceWebApp = {
    name: string,
    labels?: {[lang: string]: {description: string, name: string}},
    securite?: string,
    url?: string,
}

export type InstanceEventCallback = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & {
        instance_id: string,
    },
};

export type ApplicationPackage = {
    nom: string,
    version: string,
    securite?: string,
    dependances?: [{
        name: string,
        image: string,
    }]
};

export type GetCurrentApplicationPackagesResponse = MessageResponse & { resultats?: ApplicationPackage[] };

export class AppsConnectionWorker extends ConnectionWorker {

    async authenticate(reconnect?: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.authenticate(apiMapping, reconnect);
    }

    // Instances

    async getInstanceList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeNoeuds') as MessageResponse & {resultats?: ServerInstance[]};
    }

    async subscribeInstanceEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('instanceEvents', cb);
    }

    async unsubscribeInstanceEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('instanceEvents', cb);
    }

    // Domains

    async getDomainList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeDomaines') as Promise<ResponseGetDomainList>;
    }

    async getDomainBackupInformation(stats: boolean, cles: boolean, domains?: string[]) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({stats, cles, domaines: domains}, DOMAINE_FICHIERS, 'domainesBackupV2', {role: 'fichiers'}) as Promise<ResponseGetDomainBackupInformation>;
    }

    async rebuildDomain(domain: string, keys?: keymaster.EncryptionBase64Result) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({cles_chiffrees: keys}, domain, 'regenerer') as Promise<ResponseGetDomainBackupInformation>;
    }

    async pingDomain(domain: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, domain, 'ping', {domain});
    }

    async backupDomain(domain: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({complet: true}, domain, 'declencherBackup', {domain});
    }

    async getNonDecryptableKeyCount() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_MAITREDESCLES, 'compterClesNonDechiffrables');
    }

    async getNonDecryptableKeyBatch(skip: number, limit: number) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({skip, limite: limit}, DOMAINE_MAITREDESCLES, 'clesNonDechiffrablesV2') as ResponseGetNonDecryptableKeyBatch;
    }

    async sendEncryptedKeyBatch(keyBatch: encryption.EncryptedData, nowait: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({cles: keyBatch}, DOMAINE_MAITREDESCLES, 'rechiffrerBatch', {nowait});
    }

    async subscribeDomainEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('domainEvents', cb);
    }

    async unsubscribeDomainEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('domainEvents', cb);
    }

    // Applications

    async getApplicationList(): Promise<MessageResponse> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeApplicationsDeployees', {eventName: 'request_application_list'});
    }

    async getCurrentPackagesList(): Promise<GetCurrentApplicationPackagesResponse> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORECATALOGUES, 'listeApplications');
    }

    async getPackageContent(name: string): Promise<GetCurrentApplicationPackagesResponse> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({nom: name}, DOMAINE_CORECATALOGUES, 'infoApplication');
    }

    async installApplication(name: string, instanceId: string, exchange: string, applicationPackage: any) {
        if(!this.connection) throw new Error("Connection is not initialized");
        let command = {
            nom_application: name,
            configuration: applicationPackage,
            instance_id: instanceId,
        };
        return this.connection.sendCommand(command, DOMAINE_INSTANCE, 'installerApplication', {partition: instanceId, exchange, noverif: true});
    }

    async removeApplication(name: string, instanceId: string, exchange: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        if(exchange === '4.secure') exchange = '3.protege';  // Downgrade, the secure server is listening on 3.protege
        let command = { nom_application: name, instance_id: instanceId };
        return this.connection.sendCommand(command, DOMAINE_INSTANCE, 'supprimerApplication', {partition: instanceId, exchange, noverif: true});        
    }

    // // AI Chat application
    // async sendChatMessage(
    //     command: SendChatMessageCommand, 
    //     history: EncryptionBase64Result | null,
    //     signature: keymaster.DomainSignature,
    //     keys: {[key: string]: string},
    //     streamCallback: (e: MessageResponse)=>Promise<void>, 
    //     messageCallback: (e: messageStruct.MilleGrillesMessage)=>Promise<void>
    // ): Promise<boolean> {
    //     if(!this.connection) throw new Error("Connection is not initialized");
    //     let signedMessage = await this.connection.createRoutedMessage(
    //         messageStruct.MessageKind.Command,
    //         command, 
    //         {domaine: DOMAINE_OLLAMA_RELAI, action: 'chat'},
    //     );
    //     signedMessage.attachements = {history, signature, keys};
    //     await messageCallback(signedMessage);
    //     return await this.connection.emitCallbackResponses(signedMessage, streamCallback, {domain: DOMAINE_OLLAMA_RELAI});
    // }

    // async getConversationKeys(keyIds: string[]) {
    //     if(!this.connection) throw new Error("Connection is not initialized");
    //     return await this.connection.sendRequest(
    //         {cle_ids: keyIds}, DOMAINE_AI_LANGUAGE, 'getConversationKeys', 
    //         {domain: DOMAINE_MAITREDESCLES}
    //     ) as DecryptionKeyResponse;
    // }

}

var worker = new AppsConnectionWorker();
expose(worker);
