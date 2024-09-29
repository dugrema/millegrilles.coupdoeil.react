import '@solana/webcrypto-ed25519-polyfill';
import { expose } from 'comlink';
import { ConnectionWorker, MessageResponse, SubscriptionCallback } from 'millegrilles.reactdeps.typescript';
import apiMapping from './apiMapping.json';

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

export class AppsConnectionWorker extends ConnectionWorker {

    async authenticate(reconnect?: boolean) {
        if(!this.connection) throw new Error("Connection is not initialized");
        return await this.connection.authenticate(apiMapping, reconnect);
    }

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

    // async subscribeUserGroupDocument(groupId: string, cb: SubscriptionCallback): Promise<void> {
    //     if(!this.connection) throw new Error("Connection is not initialized");
    //     return await this.connection.subscribe('notepadGroupDocumentEvents', cb, {groupe_id: groupId});
    // }

    // async unsubscribeUserGroupDocument(groupId: string, cb: SubscriptionCallback): Promise<void> {
    //     if(!this.connection) throw new Error("Connection is not initialized");
    //     return await this.connection.unsubscribe('notepadGroupDocumentEvents', cb, {groupe_id: groupId});
    // }

}

var worker = new AppsConnectionWorker();
expose(worker);
