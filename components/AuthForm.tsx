"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Image from "next/image";
import Link from "next/link";
import {createAccount} from "@/lib/actions/user.actions";
import OTPModal from "@/OTPModal";

const formSchema = z.object({
    username: z.string().min(2).max(50),
})
type FormType = "sign-in"|"sign-up";

const authFormSchema = (formType: FormType) => {
    return z.object({
        email: z.string().email(),
        fullName:
            formType === "sign-up"
                ? z.string().min(2).max(50)
                : z.string().optional(),
    });
};

export const AuthForm = ({type}:{type: FormType}) =>{
    const [isloading, setIsloading] = useState(false)
    const [errormessage, setErrormessage] = useState("")
    const [accountId, setAccountId] = useState(null)
    const formSchema = authFormSchema(type)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
        },
    })

    // 2. Define a submit handler.
    const onSubmit=async(values: z.infer<typeof formSchema>)=>{
       setIsloading(true);
       setErrormessage("");
       try{
           const user=await createAccount({
               fullName:values.fullName||"",
                   email:values.email,
           });
           setAccountId(user.accountId);
       }catch{
           setErrormessage("Failed to create account. Please try again later.");
       }finally{
           setIsloading(false)
       }

    };
    return <><Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <h1 className="form-title">{type==="sign-in"?"Sign In":"Sign Up"}</h1>
            {type==="sign-up" &&(<FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                    <FormItem>
                        <div className='shad-form-item'>
                            <FormLabel className='shad-form-label'>Full Name</FormLabel>
                            <FormControl>
                                <Input className='shad-input' placeholder="Enter your full name" {...field} />
                            </FormControl>
                        </div>
                        <FormMessage className='shad-form-message'/>
                    </FormItem>
                )}
            />)}
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <div className='shad-form-item'>
                            <FormLabel className='shad-form-label'>Email</FormLabel>
                            <FormControl>
                                <Input className='shad-input' placeholder="Enter your email" {...field} />
                            </FormControl>
                        </div>
                        <FormMessage className='shad-form-message'/>
                    </FormItem>
                )}
            />
            <Button className='form-submit-button' disabled={isloading} type="submit">
                {type==="sign-in"?"Sign In":"Sign Up"}
                {isloading &&
                <Image src='/assets/icons/loader.svg' alt='loader' width={24} height={24} className='ml-2 animate-spin'/>
                }
            </Button>
            {errormessage && <p className='error-message'>
                *{errormessage}
            </p>}
            <div className='body-2 flex justify-center'>
                <p className='text-light-100'>
                    {type==="sign-in"
                        ?"Don't have an account?"
                        :"Already have an account?"}
                </p>
                <Link href={type==='sign-in'?"/sign-up":"/sign-in"} className='ml-1 font-medium text-brand'>
                    {type==="sign-in"?"Sign Up":"Sign In"}
                </Link>
            </div>
        </form>
    </Form>
    {accountId && (
        <OTPModal email={form.getValues("email")}
                  accountId={accountId}/>
    )}
    </>
    }


