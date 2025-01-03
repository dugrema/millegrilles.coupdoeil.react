import '@solana/webcrypto-ed25519-polyfill';
import { expose } from 'comlink';
import axios from 'axios';
import { ConnectionWorker, MessageResponse, SubscriptionCallback, SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import apiMapping from './apiMapping.json';
import { messageStruct, keymaster, encryption } from 'millegrilles.cryptography';

const DOMAINE_CORETOPOLOGIE = 'CoreTopologie';
const DOMAINE_CORECATALOGUES = 'CoreCatalogues';
const DOMAINE_CORE_PKI = 'CorePki';
const DOMAINE_MAITREDESCLES = 'MaitreDesCles';
// const DOMAINE_FICHIERS = 'fichiers';
const DOMAINE_INSTANCE = 'instance';
const DOMAINE_COREMAITREDESCOMPTES = 'CoreMaitreDesComptes';
const DOMAINE_GROSFICHIERS = 'GrosFichiers';
const DOMAINE_FILECONTROLER = 'filecontroler';

export type Domain = {
    domaine: string,
    instance_id?: string | null,
    creation?: number | null,
    presence?: number | null,
    reclame_fuuids?: boolean | null,
};

export type ResponseGetDomainList = MessageResponse & {
    resultats: Array<Domain>,
};

export type BackupEvent = {ok?: boolean, done?: boolean, err?: string};
export type DomaineEvent = {
    domaine: string,
    primaire?: boolean | null,
    reclame_fuuids?: boolean | null,
    instance_id?: string | null,
}

export type DomaineEventCallback = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & DomaineEvent & BackupEvent,
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

export type FilehostBackupInformation = {
    ok: boolean,
    filehost_id: string,
    domains?: DomainBackupInformation[],
    url?: string | null,
}

export type ResponseGetDomainBackupInformation = MessageResponse & {
    list: Array<FilehostBackupInformation>,
};

export type ResponseGetNonDecryptableKeyBatch = MessageResponse & {
    cles?: Array<{cle_id: string, signature: keymaster.DomainSignature}>,
    idx?: number,
};

export type DiskInformation = {
    mountpoint: string,
    total: number,
    used: number,
    free: number,
}

export type ServerInstancePresenceStatus = {
    disk?: DiskInformation[],
    hostname: string,
    hostnames?: string[],
    ip?: string,
    load_average?: number[],
    security: string,
    system_battery?: any,
    system_fans?: any,
    system_temperature?: any,
}

export type ServerInstancePresenceEventSubscriptionMessage = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & {timestamp: number, status: ServerInstancePresenceStatus},
};

export type ServerInstance = ServerInstancePresenceStatus & {
    instance_id: string,
    timestamp: number,
}

export type ServerInstanceConfiguredApplication = {name: string, version: string};

export type ServerInstanceContainer = {
    instance_id?: string,
    service_name?: string,
    creation?: string,
    dead?: boolean,
    etat: string,
    finished_at: string,
    labels?: {[key: string]: string},
    restart_count?: number,
    running?: boolean,
};

export type ServerInstanceService = {
    instance_id?: string,
    service_name?: string,
    creation_service?: string,
    etat: string,
    image: string,
    labels: {[key: string]: string},
    maj_service?: string,
    message_tache?: string,
    replicas?: number,
    version?: string,
};

export type ServerInstanceWebapp = {
    name: string,
    securite: string,
    url?: string,
    labels: {[language: string]: {[property: string]: string}}
}

export type ServerInstanceApplicationInformation = {
    configured_applications: ServerInstanceConfiguredApplication[],
    containers: {[name: string]: ServerInstanceContainer},
    services: {[name: string]: ServerInstanceService},
    webapps: ServerInstanceWebapp[],
}

export type ServerInstanceConfigurationMessage = MessageResponse & {configuration: {[key: string]: string}};

export type ServerInstanceApplicationMessage = MessageResponse & ServerInstanceApplicationInformation & {
    instance_id: string,
};

export type ServerInstanceApplicationSubscriptionMessage = SubscriptionMessage & {
    message: {
        complete: boolean,
        configured_applications: ServerInstanceConfiguredApplication[],
        containers: {[name: string]: ServerInstanceContainer},
        services: {[name: string]: ServerInstanceService},
        webapps: ServerInstanceWebapp[],
    }
};

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
    securityLevels?: string[],
    dependances?: [{
        name: string,
        image: string,
    }],
    securityLabel?: string | null,
};

export type GetCurrentApplicationPackagesResponse = MessageResponse & { resultats?: ApplicationPackage[] };

export type UserListItem = UserDelegationInformation;

export type ResponseGetUserList = MessageResponse & {
    usagers: Array<UserListItem>,
};

export type UserEventCallback = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & UserListItem,
};

export type UserActivation = {date_creation: number, fingerprint_pk: string};
export type UserCookie = {date_creation: number, expiration: number, hostname: string};
export type Passkey = {cred_id: string, date_creation: number, dernier_auth: number, hostname: string};
export type UserDetail = {
    user_id: string,
    activations?: UserActivation[],
    cookies?: UserCookie[],
    passkeys?: Passkey[],
}

export type PasswordDict = {[key: string]: string};
type GetPasswordsResponse = MessageResponse & {secrets?: PasswordDict};

export type CertificateRequest = {nomUsager: string, csr: string, date: number, activationTierce?: boolean};

type VerifyActivationCodeResponse = MessageResponse & {code?: string, nomusager?: string, csr?: string};

export type ChangeUserSecurityCommand = {userId: string, delegation_globale: string | null, compte_prive: boolean | null};

export type UserDelegationInformation = {
    nomUsager: string,
    userId: string,
    compte_prive: boolean | null,
    delegation_globale: string | null,
    delegations_date: number | null,
    delegations_version: number | null
};

export type FileManagerFileInformation = {
    taille?: number,
    nombre?: number,
};

export type FileManager = {
    instance_id: string,
    consignation_url?: string,
    url_download?: string,
    primaire?: boolean,
    supprime?: boolean,
    sync_actif?: boolean,
    sync_intervalle?: number,
    type_store?: string,
    "_mg-derniere-modification"?: number,
    principal?: FileManagerFileInformation,
    orphelin?: FileManagerFileInformation,
    manquant?: FileManagerFileInformation,
    hostnames?: string[],
}

export type GetFileManagerListResponse = MessageResponse & {
    liste: FileManager[],
};

export type FileManagerConfiguration = {
    instance_id: string,
    type_store?: string,
    consignation_url?: string,
    url_download?: string,
    sync_actif?: boolean,
    sync_intervalle?: number | null,
};

export type GenerateCertificateInstanceCommand = {
    csr: string, 
    securite: string, 
    role: string, 
    roles?: string[], 
    exchanges: string[], 
    dns?: {localhost?: boolean, hostnames?: string[]},
}

export type GenerateCertificateInstanceResponse = MessageResponse & { certificat?: string[] };

export type GetNonDecryptableKeyCount = MessageResponse & { compte?: number };

export type FileHostCount = {count?: number, size?: number};

export type FileHost = {
    filehost_id?: string,
    instance_id?: string,
    url_external?: string | null,
    url_internal?: string | null,
    deleted?: boolean | null,
    sync_active?: boolean | null,
    tls_external?: string | null,
    fuuid?: FileHostCount | null,
};

export type FileHostUsageEventMessage = { fuuid: FileHostCount, date: number, filehost_id: string };

export type FileControler = {
    instance_id: string,
    primary?: boolean,
    lastUpdate?: number,
};

export type GetFilehostListResponse = MessageResponse & {
    list?: FileHost[],
};

export type GetFilecontrolerListResponse = MessageResponse & {
    list?: FileControler[],
    filecontroler_primary?: string,
};

export type FilehostStatus = {filehost_id: string, connected: boolean, transfer_q_len: number}

export type FilecontrolerStatusMessage = { filecontroler_id: string, filehosts: FilehostStatus[] };

export type GetFilehostConfigurationResponse = MessageResponse & {
    configuration?: {[key: string]: string}
};

export type FilehostBackupDomainVersions = {
    ok: boolean,
    filehost_id: string,
    url?: string | null | undefined,
    versions: BackupDomainVersions[],
}

export type BackupDomainVersionResponse = MessageResponse & {
    ok: boolean,
    list: FilehostBackupDomainVersions[],
}

export type BackupDomainVersions = {
    version: string,
    date: number,
    start_date: number,
    end_date: number,
    end_date_concatene: number,
    transactions: number,
    transactions_concatene: number,
};

export type BackupDomainVersion = {domain: string, version: string | null};

export type BackupCurrentDomainsResponse = MessageResponse & {
    domains: BackupDomainVersion[],
}

export type KeymasterRecoveryRequest = MessageResponse & {cle_symmetrique_ca: string};

export type KeymasterRecoveryRequestCallback = SubscriptionMessage & {
    message: messageStruct.MilleGrillesMessage & KeymasterRecoveryRequest
};

export type AcmeConfiguration = {email?: string};
export type AcmeConfigurationResponse = MessageResponse & AcmeConfiguration;

export class AppsConnectionWorker extends ConnectionWorker {

    async authenticate(reconnect?: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.authenticate(apiMapping, reconnect);
    }

    // Instances

    // async getInstanceList() {
    //     if(!this.connection) throw new Error("Connection is not initialized");
    //     return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeNoeuds') as MessageResponse & {resultats?: ServerInstance[]};
    // }

    async getInstanceList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'requestServerInstances') as MessageResponse & {server_instances?: ServerInstance[]};
    }

    async deleteInstance(instanceId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({instance_id: instanceId}, DOMAINE_CORETOPOLOGIE, 'supprimerInstance');
    }

    async getInstanceApplicationsList(instanceId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({instance_id: instanceId}, DOMAINE_CORETOPOLOGIE, 'requestServerInstanceApplications') as Promise<ServerInstanceApplicationMessage>;
    }

    async getInstanceConfigurationList(instanceId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({instance_id: instanceId}, DOMAINE_CORETOPOLOGIE, 'requestServerInstanceConfiguration') as Promise<ServerInstanceConfigurationMessage>;
    }

    async generateSatelliteInstanceCertificate(command: GenerateCertificateInstanceCommand) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(command, DOMAINE_CORE_PKI, 'signerCsr') as Promise<GenerateCertificateInstanceResponse>;
    }

    async setFilehostForInstance(instanceId: string, filehostId: string | null) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({instance_id: instanceId, filehost_id: filehostId}, DOMAINE_CORETOPOLOGIE, 'setFilehostForInstance') as Promise<GenerateCertificateInstanceResponse>;
    }

    async setFileManagerForInstance(instanceId: string, fileManagerId: string | null) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({instance_id: instanceId, consignation_id: fileManagerId}, DOMAINE_CORETOPOLOGIE, 'setConsignationInstance') as Promise<GenerateCertificateInstanceResponse>;
    }

    async requestKeymasterRecovery() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({}, DOMAINE_MAITREDESCLES, 'querySymmetricKeyRepair', {nowait: true});
    }

    async sendKeymasterRecoveryKey(fingerprint: string, encryptedKey: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({fingerprint, cle: encryptedKey}, DOMAINE_MAITREDESCLES, 'cleSymmetrique', {partition: fingerprint});
    }

    async subscribeInstanceEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('instanceEvents', cb);
    }

    async unsubscribeInstanceEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('instanceEvents', cb);
    }

    async subscribeKeymasterEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('keymasterRecoveryEvents', cb);
    }

    async unsubscribeKeymasterEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('keymasterRecoveryEvents', cb);
    }

    async subscribeInstanceApplicationEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('instanceApplicationsDomainsEvents', cb);
    }

    async unsubscribeInstanceApplicationEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('instanceApplicationsDomainsEvents', cb);
    }

    // Domains

    async getDomainList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeDomaines') as Promise<ResponseGetDomainList>;
    }

    async getDomainBackupInformation(stats: boolean, cles: boolean, domains?: string[], version?: string | null) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest(
            {stats, cles, domaines: domains, version}, DOMAINE_FILECONTROLER, 'domainesBackupV2', 
            {role: DOMAINE_FILECONTROLER}
        ) as Promise<ResponseGetDomainBackupInformation>;
    }

    async getDomainVersionsBackupInformation(domain: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest(
            {domaine: domain}, DOMAINE_FILECONTROLER, 'domaineVersionBackupV2', 
            {role: DOMAINE_FILECONTROLER}
        ) as Promise<BackupDomainVersionResponse>;
    }

    async getDomainBackupVersions() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'getDomainBackupVersions') as Promise<BackupCurrentDomainsResponse>;
    }

    async setDomainBackupVersion(domain: string, version: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({domaine: domain, version}, DOMAINE_CORETOPOLOGIE, 'setBackupDomainVersion');
    }

    async rebuildDomain(domain: string, keys?: keymaster.EncryptionBase64Result, version?: string | null) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({cles_chiffrees: keys, version}, domain, 'regenerer') as Promise<ResponseGetDomainBackupInformation>;
    }

    async pingDomain(domain: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, domain, 'ping', {domain});
    }

    async backupDomain(domain: string, noverif?: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({complet: true}, domain, 'declencherBackup', {noverif});
    }

    async getNonDecryptableKeyCount() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.sendRequest({}, DOMAINE_MAITREDESCLES, 'compterClesNonDechiffrables') as GetNonDecryptableKeyCount;
    }

    async getNonDecryptableKeyBatch(skip: number, limit: number) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({skip, limite: limit}, DOMAINE_MAITREDESCLES, 'clesNonDechiffrablesV2') as ResponseGetNonDecryptableKeyBatch;
    }

    async sendEncryptedKeyBatch(keyBatch: encryption.EncryptedData, nowait: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({cles: keyBatch}, DOMAINE_MAITREDESCLES, 'rechiffrerBatch', {nowait, timeout: 30_000});
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

    async getPackageVersions(name: string): Promise<GetCurrentApplicationPackagesResponse> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({nom: name}, DOMAINE_CORECATALOGUES, 'listeVersionsApplication');
    }

    async installApplication(name: string, instanceId: string, exchange: string, applicationPackage: any) {
        if(!this.connection) throw new Error("Connection is not initialized");
        let command = {
            nom_application: name,
            configuration: applicationPackage,
            instance_id: instanceId,
        };
        return this.connection.sendCommand(
            command, DOMAINE_INSTANCE, 'installerApplication', 
            {partition: instanceId, exchange, role: 'instance', timeout: 300_000}
        );
    }

    async upgradeApplication(name: string, instanceId: string, exchange: string, applicationPackage: any) {
        if(!this.connection) throw new Error("Connection is not initialized");
        let command = {
            nom_application: name,
            configuration: applicationPackage,
            instance_id: instanceId,
        };
        return this.connection.sendCommand(
            command, DOMAINE_INSTANCE, 'upgradeApplication', 
            {partition: instanceId, exchange, role: 'instance', timeout: 300_000}
        );
    }

    async removeApplication(name: string, instanceId: string, exchange: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        if(exchange === '4.secure') exchange = '3.protege';  // Downgrade, the secure server is listening on 3.protege
        let command = { nom_application: name, instance_id: instanceId };
        return this.connection.sendCommand(command, DOMAINE_INSTANCE, 'supprimerApplication', {partition: instanceId, exchange, role: 'instance'});        
    }

    async startApplication(name: string, instanceId: string, exchange: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        if(exchange === '4.secure') exchange = '3.protege';  // Downgrade, the secure server is listening on 3.protege
        let command = { nom_application: name, instance_id: instanceId };
        return this.connection.sendCommand(command, DOMAINE_INSTANCE, 'demarrerApplication', {partition: instanceId, exchange, role: 'instance'});
    }

    async stopApplication(name: string, instanceId: string, exchange: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        if(exchange === '4.secure') exchange = '3.protege';  // Downgrade, the secure server is listening on 3.protege
        let command = { nom_application: name, instance_id: instanceId };
        return this.connection.sendCommand(command, DOMAINE_INSTANCE, 'arreterApplication', {partition: instanceId, exchange, role: 'instance'});        
    }

    async refreshPackages() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({}, DOMAINE_INSTANCE, 'transmettreCatalogues', {role: 'instance'});
    }

    async getApplicationPasswords(instanceId: string, exchange: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_INSTANCE, 'getPasswords', {role: 'instance', partition: instanceId, exchange}) as GetPasswordsResponse;
    }

    // Users

    async getUserList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_COREMAITREDESCOMPTES, 'getListeUsagers') as Promise<ResponseGetUserList>;
    }
    
    async getUserPasskeys(userId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({userId}, DOMAINE_COREMAITREDESCOMPTES, 'getPasskeysUsager') as Promise<MessageResponse & UserDetail>;
    }

    async verifyActivationCode(userName: string, code: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({nom_usager: userName, code}, DOMAINE_COREMAITREDESCOMPTES, 'getCsrRecoveryParcode') as Promise<VerifyActivationCodeResponse>;
    }

    async activateAccountByAdmin(userId: string, request: CertificateRequest) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({userId, demandeCertificat: request}, DOMAINE_COREMAITREDESCOMPTES, 'signerCompteParProprietaire');
    }

    async changeUserSecurity(command: ChangeUserSecurityCommand) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(command, DOMAINE_COREMAITREDESCOMPTES, 'majUsagerDelegations') as Promise<MessageResponse & UserDelegationInformation>;
    }

    async evictUser(userId: string, resetWebauthn: boolean, evictAllSessions: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(
            {userId, resetWebauthn, evictAllSessions}, 
            DOMAINE_COREMAITREDESCOMPTES, 'resetWebauthnUsager');
    }

    async subscribeUserEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('userEvents', cb);
    }

    async unsubscribeUserEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('userEvents', cb);
    }

    // File managers
    async getFileManagerList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'getConfigurationFichiers') as Promise<GetFileManagerListResponse>;
    }

    async syncFileManagers() {
        throw new Error("obsolete")
        // if(!this.connection) throw new Error("Connection is not initialized");
        // return this.connection.sendCommand({}, DOMAINE_FICHIERS, 'declencherSync', {role: 'fichiers'});
    }

    async reindexFileManagers() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({}, DOMAINE_GROSFICHIERS, 'reindexerFichiers', {timeout: 60_000});
    }

    async resetTransfersFileManagers() {
        throw new Error("obsolete")
        // if(!this.connection) throw new Error("Connection is not initialized");
        // return this.connection.sendCommand({}, DOMAINE_FICHIERS, 'resetTransfertsSecondaires', {role: 'fichiers'});
    }

    async removeFileManager(instanceId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({instance_id: instanceId}, DOMAINE_CORETOPOLOGIE, 'supprimerConsignation');
    }

    async setFileManagerConfiguration(configuration: FileManagerConfiguration) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(configuration, DOMAINE_CORETOPOLOGIE, 'configurerConsignation');
    }

    async subscribeFileManagerEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('fileManagerEvents', cb);
    }

    async unsubscribeFileManagerEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('fileManagerEvents', cb);
    }

    // File hosting

    async addFileHost(url: string, tls_external: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({url_external: url, tls_external}, DOMAINE_CORETOPOLOGIE, 'filehostAdd');
    }

    async updateFileHost(filehost: FileHost) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(filehost, DOMAINE_CORETOPOLOGIE, 'filehostUpdate');
    }

    async deleteFileHost(filehostId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({filehost_id: filehostId}, DOMAINE_CORETOPOLOGIE, 'filehostDelete');
    }

    async getFilehostList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'getFilehosts') as Promise<GetFilehostListResponse>;
    }

    async getFilecontrolersList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'getFilecontrolers') as Promise<GetFilecontrolerListResponse>;
    }

    async resetVisitsClaims() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({}, DOMAINE_CORETOPOLOGIE, 'resetVisitsClaims');
    }

    async resetTransfers() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({}, DOMAINE_CORETOPOLOGIE, 'resetTransfers');
    }

    async getFilehostConfiguration() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'getFilehostConfiguration') as Promise<GetFilehostConfigurationResponse>;
    }

    async setDefaultFilehost(filehostId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({filehost_id: filehostId}, DOMAINE_CORETOPOLOGIE, 'setDefaultFilehost');
    }

    async subscribeFilehostingEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.subscribe('filehostingEvents', cb);
    }

    async unsubscribeFilehostingEvents(cb: SubscriptionCallback): Promise<void> {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.unsubscribe('filehostingEvents', cb);
    }

    // Generic

    async saveKeyToKeyMaster(encryptedKey: {[keymasterId: string]: string}, caKey: keymaster.DomainSignature) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand({cles: encryptedKey, signature: caKey}, DOMAINE_MAITREDESCLES, 'ajouterCleDomaines');
    }

    async authenticateFilehost(url: string) {
        // Authenticate with filehost
        let authenticateUrl = new URL(url + '/authenticate')
        let authenticationMessage = await this.createRoutedMessage(
            messageStruct.MessageKind.Command, {}, {domaine: 'filehost', action: 'authenticate'});
        let cert = await this.getMessageFactoryCertificate()
        let caPem = cert.pemMillegrille;
        // let certCa = await workers.encryption.caCertificate;
        // let pemCa = certCa?.pemChain.pop();
        authenticationMessage.millegrille = caPem;
        let response = await axios({method: 'POST', data: authenticationMessage, url: authenticateUrl.href});
        if(response.status !== 200) throw new Error("Access denied")        
    }

    async getAcmeConfiguration(instanceId: string) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest(
            {}, DOMAINE_INSTANCE, 'configurationAcme', 
            {partition: instanceId, role: 'instance'}
        ) as Promise<AcmeConfigurationResponse>;
    }

    async updateAcmeConfiguration(instanceId: string, configuration: AcmeConfiguration) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(
            configuration, DOMAINE_INSTANCE, 'updateAcmeConfiguration', 
            {partition: instanceId, role: 'instance'}
        ) as Promise<AcmeConfigurationResponse>;
    }

    async issueAcmeCertificate(instanceId: string, configuration: AcmeConfiguration) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendCommand(
            configuration, DOMAINE_INSTANCE, 'issueAcmeCertificate', 
            {partition: instanceId, role: 'instance', timeout: 180_000}
        ) as Promise<AcmeConfigurationResponse>;
    }
}

var worker = new AppsConnectionWorker();
expose(worker);
