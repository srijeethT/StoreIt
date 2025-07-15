import React from 'react';
import Sort from "@/components/sort";
import {getFiles, sizeOfFile} from "@/lib/actions/file.actions";
import {Models} from "node-appwrite";
import Card from "@/components/Card";
import {getFileType, getFileTypesParams, getUsageSummary} from "@/lib/utils";

const Page= async ({searchParams,params}:SearchParamProps)=>{

    const type=((await params)?.type as string)||"";

    const searchText=((await searchParams)?.query as string)||"";
    const sort=((await searchParams)?.sort as string)||"";

    const types=getFileTypesParams(type) as FileType[]

    const size=await sizeOfFile(types[0]);

    const files=await getFiles({types,searchText,sort});

    return <div className="page-container">
        <section className="w-full">
            <h1 className="h1 capitalize">{type}</h1>
            <div className="total-size-section">
                <p className="body-1">
                    Total: <span>{(size / (1024 * 1024)).toFixed(1)} MB</span>
                </p>
                <div className="sort-container">
                    <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>
                    <Sort/>
                </div>
            </div>
        </section>


        {files.total>0 ? (
            <section className="file-list">
                {files.documents.map((file: Models.Document) => (
                   <Card key={file.$id} file={file} />
                ))}
            </section>
        ):<p className="empty-list">No files uploaded</p>}
    </div>
};

export default Page;