import AuthCard from "../../components/auth/AuthCard"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useNavigate } from "react-router-dom"
import React, {  useRef } from "react"

export const BankDetail=()=>{
    const nameRef = useRef<HTMLInputElement | null>(null);
    const acntNumberRef = useRef<HTMLInputElement | null>(null);
    const ifscRef =useRef<HTMLInputElement | null>(null);
    const branchRef = useRef<HTMLInputElement | null>(null);

    const navigate= useNavigate()
  
    function onclickhandler(){
        navigate("/auth/marital")
    }
    return <>
    <AuthCard title="Confirm Your Bank Detail">
     <div className="flex flex-col gap-6 my-5" >
        //inputs with label
        <Input  
        ref={nameRef} 
        label="Account holder name" 
        placeholder="Name of the account holder"
         onKeyUp={(e:React.KeyboardEvent<HTMLInputElement>)=>{if(e.key=="Enter"){
          acntNumberRef.current?.focus()
        }}}></Input>

        <Input
         ref={acntNumberRef} 
         label="Bank Account Number" 
         placeholder="Account number"
         onKeyUp={(e:React.KeyboardEvent<HTMLInputElement>)=>{if(e.key=="Enter"){
          ifscRef.current?.focus()
        }}}></Input>
    
        <Input 
        ref={ifscRef} 
        label="IFSC"  
        placeholder="IFSC Code"
        onKeyUp={(e:React.KeyboardEvent<HTMLInputElement>)=>{if(e.key=="Enter"){
          branchRef.current?.focus()
        }}} ></Input>

        <Input 
        ref={branchRef} 
        label="branch" 
        placeholder="HDFC" ></Input>
<Button onclick={onclickhandler}>Confirm & next </Button>
        </div>   

    </AuthCard>
    </>
}