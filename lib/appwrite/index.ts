"use server"
import {cookies} from "next/headers";
import {appwriteConfig} from "@/lib/appwrite/config";
import {Account,Databases,Storage,Avatars,Client} from "node-appwrite";

export const createSessionClient = async() => {
    const client=new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)

    const session=(await cookies()).get('appwrite-session');
    if(!session||!session.value) throw new Error("no session");

    client.setSession(session.value);

    return {
        get account(){
            return new Account(client);
        },
        get databases(){
            return new Databases(client);
        },
    }
};
export const createAdminClient = async() => {
    const client=new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.secretKey)
    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        },
        get storage(){
            return new Storage(client);
        },
        get avatar(){
            return new Avatars(client);
        }
    };
}