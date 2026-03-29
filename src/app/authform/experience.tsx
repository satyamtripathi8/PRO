import { useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
const options = ["No Experience", "1 Year", "2 Year", "3 Year", "4 Year ", "5 Year +"];

export default function ExperienceForm() {
    const [selected, setSelected] = useState<string | null>(null);
     const navigate= useNavigate()
     
    function onclickhandler(){
        navigate("/Home")
    }

    return (
        <AuthCard title="What’s your trading experience ?" >



            <div className="grid grid-cols-2  my-4">
                {options.map((option) => {
                    const isSelected = selected === option;

                    return (
                        <div
                            key={option}
                            onClick={() => setSelected(option)}
                            className={`
                 mx-2 px-2 py-2 my-1 rounded-md flex justify-center border cursor-pointer
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
            <Button onclick={onclickhandler}>Confirm</Button>
        </AuthCard>


    );
}