import { useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
const options = ["Single", "Married"];

export default function MaritalStatus() {
   const navigate= useNavigate()
  
    function onclickhandler(){
        navigate("/auth/anualincome")
    }
  const [selected, setSelected] = useState<string | null>(null);

  return (
  <AuthCard title="marital status" >

    

      <div className="flex gap-x-6 justify-center my-4">
        {options.map((option) => {
          const isSelected = selected === option;

          return (
            <div
              key={option}
              onClick={() => setSelected(option)}
              className={`
                px-10 py-2 rounded-md border cursor-pointer
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