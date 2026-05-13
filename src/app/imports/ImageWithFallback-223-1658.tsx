import imgImage5 from "figma:asset/a7d07b92f4849dcd91f999211a4f6982cfd3f72f.png";

export default function ImageWithFallback() {
  return (
    <div className="bg-white relative rounded-[16px] size-full" data-name="ImageWithFallback">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute left-[calc(50%+0.5px)] size-[193px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="image 5">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage5} />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(229,231,235,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}