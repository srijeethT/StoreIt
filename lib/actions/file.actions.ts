"use server"

import {createAdminClient, createSessionClient} from "@/lib/appwrite";
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

const createQueries=(currentUser:Models.Document,types:string[],searchText:string,sort:string,limit?:number)=>{
    const queries=[
        Query.or([
            Query.equal("ownerId",[currentUser.$id]),
            Query.contains("users",[currentUser.email]),
        ])
    ];
    if(types.length>0) queries.push(Query.equal("type",types));
    if(searchText) queries.push(Query.contains("name",searchText));
    if(limit) queries.push(Query.limit(limit));

    if(sort){
        const [sortBy,orderBy]=sort.split("-");

        queries.push(orderBy==="asc"?Query.orderAsc(sortBy):Query.orderDesc(sortBy),);
    }
    return queries;
};

export const getFiles=async ({types=[],searchText,sort="$createdAt-desc",limit}:GetFilesProps) => {
    const {databases} = await createAdminClient();

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser,types,searchText,sort,limit);

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

export const updateFileUsers=async ({fileId,emails,path}:UpdateFileUsersProps) => {
    const {databases}=await createAdminClient();

    try{
        const updatedFile=await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            fileId,
            {
                users:emails,
            },
        );
        revalidatePath(path);
        return parseStrinfy(updatedFile);
    }catch (error) {
        handleError(error,"Failed to rename file");
    }
}

export const deleteFile=async ({fileId,bucketFileId,path}:DeleteFileProps) => {
    const {databases,storage}=await createAdminClient();

    try{
        const deletedFile=await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            fileId,
        );
        if(deletedFile){
            await storage.deleteFile(appwriteConfig.bucketId,bucketFileId)
        }
        revalidatePath(path);
        return parseStrinfy({status: 'success'});
    }catch (error) {
        handleError(error,"Failed to rename file");
    }
}

export async function getTotalSpaceUsed() {
    try {
        const { databases } = await createSessionClient();
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User is not authenticated.");

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.fileCollectionId,
            [Query.equal("owner", [currentUser.$id])],
        );

        const totalSpace = {
            image: { size: 0, latestDate: "" },
            document: { size: 0, latestDate: "" },
            video: { size: 0, latestDate: "" },
            audio: { size: 0, latestDate: "" },
            other: { size: 0, latestDate: "" },
            used: 0,
            all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
            const fileType = file.type as FileType;
            totalSpace[fileType].size += file.size;
            totalSpace.used += file.size;

            if (
                !totalSpace[fileType].latestDate ||
                new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
            ) {
                totalSpace[fileType].latestDate = file.$updatedAt;
            }
        });

        return parseStrinfy(totalSpace);
    } catch (error) {
        handleError(error, "Error calculating total space used:, ");
    }
}

    export async function sizeOfFile(fileType: FileType) {
        try {
            const { databases } = await createSessionClient();
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User is not authenticated.");

            const files = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.fileCollectionId,
                [
                    Query.equal("owner", [currentUser.$id]),
                    Query.equal("type", [fileType]), // filter by given type
                ],
            );

            let totalSize = 0;

            files.documents.forEach((file) => {
                totalSize += file.size;
            });

            return  totalSize;
        } catch (error) {
            handleError(error, `Error calculating space used for type: ${fileType}`);
        }
    }