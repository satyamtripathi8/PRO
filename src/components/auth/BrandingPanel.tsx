import logo from "../../assets/logo.jpeg"
export default function BrandingPanel({ title, subtitle }: any) {
  return (
    <div className="    flex flex-col items-center justify-center mx-20 text-white  min-h-screen text-center">
      <img src={logo}  className="size-60 my-6 rounded-full"   alt="" />
      
      <p className="text-lg opacity-80 mb-2">{title}</p>
      
      <h2 className="text-2xl font-semibold leading-relaxed max-w-md">
        {subtitle}
      </h2>
    </div>
  );
}