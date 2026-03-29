
import AuthCard from "../../components/auth/AuthCard"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { useNavigate } from "react-router-dom"
export const PanVerify =()=>{
     
     const navigate= useNavigate()
     function onclickhandler(){
        navigate("/auth/bankdetail")
     }
    return <>
    <AuthCard
    title="Enter your PAN " >
        <div className="flex-col  flex gap-y-8 w-1/2" >
            <Input label="PAN is compulsory for investigating in india"   ></Input>
            <Button  onclick={onclickhandler} >Confirm & Next</Button>
        </div>

    </AuthCard>
    </>
}