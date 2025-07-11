"use client"
import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import {Button} from "@/components/ui/button";
import {cn, convertFileToUrl} from "@/lib/utils";
import Image from "next/image";
import {getFileType} from "@/lib/utils";
import Thumbnail from "@/components/Thumbnail";

interface  Props{
    ownerId:string;
    accountId:string;
    className?:string;
}

const FileUploader = ({ownerId,accountId,className}:Props) => {
    const [files, setFiles] = React.useState([]);

    const onDrop = useCallback( async (acceptedFiles : File[]) => {
        setFiles(acceptedFiles);
    }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    const handleRemoveFile = (e:React.MouseEvent<HTMLImageElement,MouseEvent>,fileName:string)=>{
        e.stopPropagation();
        setFiles((prevfiles)=>prevfiles.filter((file)=>file.name!==fileName));
    }
    return (
        <div {...getRootProps()} className='cursor-pointer'>
            <input {...getInputProps()} />
            <Button type="button" className={cn("uploader-button",className)}>
                <Image src='/assets/icons/upload.svg' alt='upload' width={24} height={24} />{" "}
                <p>Upload</p>
            </Button>
            {files.length > 0 && (
                <ul className='uploader-preview-list'>
                    <h4 className='h4 text-light-100'>Uploading</h4>
                    {files.map((file,index)=>{
                        const {type,extension}= getFileType(file.name);
                    return (
                        <li key={`${file.name}-${index}`} className='uploader-preview-item'>
                            <div className="flex items-center gap-3">
                                <Thumbnail type={type} extension={extension} url={convertFileToUrl(file)}/>
                                <div className='preview-item-name'>
                                    {file.name}
                                    <Image src="/assets/icons/file-loader.gif" alt="loader" width={80} height={26} />
                                </div>
                            </div>
                            <Image src="/assets/icons/remove.svg" alt="remove" width={24} height={24}  onClick={(e)=>handleRemoveFile(e,file.name)} />
                        </li>
                        )
                    })}
                </ul>
            )}
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag 'n' drop some files here, or click to select files</p>
            }
        </div>
    )
}
export default FileUploader;