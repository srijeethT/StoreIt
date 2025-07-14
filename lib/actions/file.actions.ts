"use server"

import {createAdminClient} from "@/lib/appwrite";
import {appwriteConfig} from "@/lib/appwrite/config";
import {ID, Models, Query} from "node-appwrite";
import {InputFile} from "node-appwrite/file";
import {constructFileUrl, getFileType, parseStrinfy} from "@/lib/utils";
import {revalidatePath} from "next/cache";
import {getCurrentUser} from "@/lib/actions/user.actions";

const handleError=(error:unknown,message:string) => {
    console.log(error,message);
    throw error;
}

export const uploadFile = async ({file,ownerId,accountId,path}:UploadFileProps) => {
    const {storage,databases}=await createAdminClient();
    try {
        const inputFile=InputFile.fromBuffer(file,file.name)

        const bucketFile=await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
            );

        const fileDocument={
            type:getFileType(bucketFile.name).type,
            name:bucketFile.name,
            url:constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            ownerId : ownerId,
            owner:ownerId,
            size: bucketFile.sizeOriginal,
            accountId,
            users:[],
            bucketFileId:bucketFile.$id,
        };

        const newFile=await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            ID.unique(),
            fileDocument,
        )
            .catch(async (error:unknown) => {
                await storage.deleteFile(appwriteConfig.bucketId,bucketFile.$id);
                handleError(error,"Failed to create file document");
            })
        revalidatePath(path);
        return parseStrinfy(newFile)
    }catch (error) {
        handleError(error,"Failed to upload file");
    }
}

const createQueries=(currentUser:Models.Document)=>{
    const queries=[
        Query.or([
            Query.equal("ownerId",[currentUser.$id]),
            Query.contains("users",[currentUser.email]),
        ])
    ];
    return queries;
};

export const getFiles=async () => {
    const {databases} = await createAdminClient();

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser);

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            queries,
        );

        return parseStrinfy(files);
    } catch (error) {
        handleError(error, "Failed to get files");
    }
}

export const renameFile=async ({fileId,name,extension,path}:RenameFileProps) => {
    const {databases}=await createAdminClient();

    try{
        const newName=`${name}.${extension}`;
        const updatedFile=await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            fileId,
            {
                name:newName,
            },
        );
        revalidatePath(path);
        return parseStrinfy(updatedFile);
    }catch (error) {
        handleError(error,"Failed to rename file");
    }
}