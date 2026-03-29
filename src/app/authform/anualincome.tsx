import { useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
const options = ["More than 5 Crores","1 Crore - 5 Crores","50 Lakh to 1 Crore","25 Lakh to 50 Lakh","10 Lakh to 25 Lakh","5 Lakh to 10 Lakh","1 Lakh to 5 Lakh","Upto 5 Lakh" ];

export default function AnualIncome() {
  const [selected, setSelected] = useState<string | null>(null);
   const navigate= useNavigate()
   
    function onclickhandler(){
        navigate("/auth/occupations")
    }

  return (
  <AuthCard  title="What’s your annual income ?" >

    

      <div className="grid grid-cols-3  my-4">
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
        <Button onclick={onclickhandler} >Continue</Button>

      </AuthCard>

    
  );
}