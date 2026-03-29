import { useState,useEffect } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
const options = ["Private Sector Service","Public Sector Service","Government service","Housewife","Student","Self Employed","Business","Professional","Retired","Farmer","Service", "Agriculturist" ];

export default function Occupations() {
  const [selected, setSelected] = useState<string | null>(null);
   const navigate= useNavigate()
    useEffect(()=>{
           window.addEventListener("keyup",(e)=>{
               if(e.key==="Enter"){
                   navigate("/auth/experience")
               }
           })
        })
    function onclickhandler(){
        navigate("/auth/experience")
    }

  return (
  <AuthCard  title="whats your occupation?" >

    

      <div className="grid grid-cols-2  my-4">
        {options.map((option) => {
          const isSelected = selected === option;

          return (
            <div
              key={option}
              onClick={() => setSelected(option)}
              className={`
                 mx-2 px-2 py-2 my-1 flex justify-center rounded-md border cursor-pointer
                transition-all duration-200
                ${isSelected 
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                  : "border-gray-300 text-gray-600 hover:border-blue-400"}
              `}
            >
              {option}
            </div>
          );
        })}
        
      </div>
      <Button onclick={onclickhandler} >Confirm</Button>
      </AuthCard>

    
  );
}