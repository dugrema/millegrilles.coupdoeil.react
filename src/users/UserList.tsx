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
                <tr key={item.userId} className="hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0">
                    <td className="px-4 py-3 text-white font-medium">
                        <Link to={`/coupdoeil2/users/${item.userId}`} className="hover:text-blue-400 transition-colors">
                            {item.nomUsager}
                        </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{security}</td>
                </tr>
            )
        })
    }, [users]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <Link to='/coupdoeil2'
                    className='inline-flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-105 active:bg-slate-700 shadow-lg rounded-xl transition-all duration-200'>
                    Back
                </Link>
                <h1 className='text-3xl font-bold text-white'>Users</h1>
            </div>

            <section className='bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl'>
                <h2 className='text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2 flex items-center'>
                    <span className='mr-2'>👥</span> User list
                </h2>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm'>
                        <thead className='text-xs text-slate-400 uppercase bg-slate-900/50'>
                            <tr>
                                <th className='px-4 py-3'>User name</th>
                                <th className='px-4 py-3'>Security</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-700'>
                            {userRows.length > 0 ? (
                                userRows
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-center text-slate-400">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
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
