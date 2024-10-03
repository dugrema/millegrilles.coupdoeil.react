import { ChangeEvent, useCallback, useEffect, useState } from "react";
import UploadButton from "../components/UploadButton";

function MasterKeyLoader(props: MasterKeyProps) {

    let [password, setPassword] = useState('');
    let [encryptedKey, setEncryptedKey] = useState('');
    let [invalid, setInvalid] = useState(false);

    let uploadHandler = useCallback((e: FileList | null)=>{
        console.debug("Upload ", e);
    }, []);

    useEffect(()=>{
        if(password && encryptedKey) {
            console.debug("Try to decrypt the key");

            setInvalid(false);
        }
    }, [password, encryptedKey, setInvalid]);

    return (
        <div className="grid grid-cols-2">
            <input type="text" placeholder="Master key password, ex: p7Pxu+wrscBTlavrodLZRUAPbqHQge9+KAGuJedhOwU"/>
            <div>
                <UploadButton id="uploadId" onChange={uploadHandler} 
                    className="btn pl-7 inline-block text-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-800">
                        <p>Upload</p>
                </UploadButton>
            </div>
            <div className="min-h-7">
                {invalid?
                    <p className='text-red-600'>The key file and password do not match.</p>
                    :<></>
                }
            </div>
        </div>
    )
}

export default MasterKeyLoader;

type MasterKeyProps = {
    // children?: React.ReactElement,
    onChange: (key: MasterKey | null) => void,
}

export type MasterKey = {
    secret: Uint8Array,
    encryptedKey?: string | null,
    password?: string | null,
}
