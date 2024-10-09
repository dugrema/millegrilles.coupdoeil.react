import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserListItem } from '../workers/connection.worker';

export type UserDetailStore = UserListItem & {
};

interface UserStoreState {
    users: Array<UserDetailStore> | null,
    setUsers: (users: Array<UserDetailStore>) => void,
    updateUser: (user: UserDetailStore) => void,
    clear: () => void,
};

const useUserStore = create<UserStoreState>()(
    devtools(
        (set) => ({
            users: null,
            setUsers: (users) => set(() => ({ users })),
            updateUser: (user) => set(state=>{
                let items = state.users;
                if(!items) return {users: [user]};  // New
                let existingItem = items.filter(item=>item.userId === user.userId).pop() || {};
                let itemUpdate = {...existingItem, ...user};
                let itemsUpdate = items.map(item=>{
                    if(item.userId === itemUpdate.userId) { return itemUpdate };
                    return item;
                })
                return {users: itemsUpdate};
            }),
            clear: () => set(()=>({users: null})),
        })
    ),
);

export default useUserStore;
