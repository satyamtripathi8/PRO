import React, { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import AuthCard from "../../components/auth/AuthCard";
const PhoneCard: React.FC = () => {
  const navigate= useNavigate()
  function EnterEventHandler(e:React.KeyboardEvent<HTMLInputElement>){
       if(e.key==="Enter"){
                   navigate("/auth/verify")
               }
  }
  const [phone, setPhone] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // remove non-digits
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
  };

  const isValid: boolean = /^[6-9]\d{9}$/.test(phone);

  const handleSubmit = (): void => {
    navigate("/auth/verify")
    if (!isValid) return;
    console.log("Phone submitted:", phone);
   
  };

  return (
    <AuthCard
      title="
   verify Yourself"  ><div className="my-5 flex flex-col gap-y-2  w-full max-w-sm ">
        <label className="block text-sm font-medium mb-2">
          Phone Number
        </label>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ">
          <span className="px-3  text-gray-600">+91</span>
          <input
            type="tel"
            value={phone}
            onChange={handleChange}
            maxLength={10}
            placeholder=""
            className="flex-1 px-3 py-2 outline-none bg-transparent"
            onKeyUp={EnterEventHandler}
          />
        </div>
           <p className="text-gray-500 text-sm mb-5">By continuing you agree to the terms and condition</p>
        {phone.length === 10 && !isValid && (
          <p className="text-red-500 text-sm mt-2">
            Invalid phone number
          </p>
        )}
        <Button onclick={handleSubmit} >
        Continue
      </Button>
      </div>

      
    </AuthCard>


  );
};

export default PhoneCard;