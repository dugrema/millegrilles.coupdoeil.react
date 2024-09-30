import '@solana/webcrypto-ed25519-polyfill';
import { expose } from 'comlink';
import { ConnectionWorker, MessageResponse, SubscriptionCallback, SubscriptionMessage } from 'millegrilles.reactdeps.typescript';
import apiMapping from './apiMapping.json';
import { messageStruct } from 'millegrilles.cryptography';

const DOMAINE_CORETOPOLOGIE = 'CoreTopologie';
const DOMAINE_MAITREDESCLES = 'MaitreDesCles';

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

export class AppsConnectionWorker extends ConnectionWorker {

    async authenticate(reconnect?: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.authenticate(apiMapping, reconnect);
    }

    // Instances


    // Domains

    async getDomainList() {
        if(!this.connection) throw new Error("Connection is not initialized");
        return this.connection.sendRequest({}, DOMAINE_CORETOPOLOGIE, 'listeDomaines') as Promise<ResponseGetDomainList>;
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
