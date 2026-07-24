import { Link } from "react-router-dom";
import useUserStore from "./userStore";
import React, { useMemo } from "react";
import { mapUserSecurity } from "./Users";
import { UserDelegationInformation } from "../workers/connection.worker";

function UserList() {

    let users = useUserStore(state=>state.users);

    let userRows = useMemo(()=>{
        if(!users) return [];

        let userCopy = [...users];
        userCopy.sort(sortUsers);

        return userCopy.map(item=>{
            let security = mapUserSecurity(item);
            return (
                <React.Fragment key={item.userId}>
                    <Link to={`/coupdoeil2/users/${item.userId}`} 
                        className='underline'>
                            {item.nomUsager}
                    </Link>
                    <p>{security}</p>
                </React.Fragment>
            )
        })
    }, [users]);

    return (
        <>
<Link to='/coupdoeil2'
                className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate/700 hover:scale-105 active:bg-slate/700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
            </Link>



            <h1 className='text-xl font-bold pt-4'>Users</h1>

            <section>
                <h2 className='text-lg font-bold pt-4 pb-2'>User list</h2>
                
                <div className='grid grid-cols-2 pt-2 pb-2'>
                    <p className='font-bold pb-2'>User name</p>
                    <p className='font-bold pb-2'>Security</p>

                    {userRows}
                </div>
            </section>
        </>
    );
}

export default UserList;

function sortUsers(a: UserDelegationInformation, b: UserDelegationInformation) {
    if(a===b) return 0;
    let usernameA = a.nomUsager;
    let usernameB = b.nomUsager;
    if(usernameA !== usernameB) {
        if(!usernameA) return 1;
        if(!usernameB) return -1;
        return usernameA.localeCompare(usernameB);
    }
    return a.userId.localeCompare(b.userId);
}
