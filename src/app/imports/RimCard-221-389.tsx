import svgPaths from "./svg-a1qm6qb0np";
import imgImage5 from "figma:asset/a7d07b92f4849dcd91f999211a4f6982cfd3f72f.png";

function ProductBrand() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="product.brand">
      <p className="basis-0 font-['Inter:Semi_Bold',sans-serif] font-semibold grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#101828] text-[24px] tracking-[-0.7125px]">BBS</p>
    </div>
  );
}

function ProductModel() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="product.model">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#4a5565] text-[14px] text-nowrap tracking-[-0.1784px] whitespace-pre">BBS CH-R</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-center leading-[20px] not-italic relative rounded-[16px] shrink-0 text-[#101828] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre" data-name="Container">
      <p className="relative shrink-0">8</p>
      <p className="relative shrink-0">×</p>
      <p className="relative shrink-0">{`18"`}</p>
      <p className="relative shrink-0">ET45</p>
      <p className="relative shrink-0">5x112</p>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="Label">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#1447e6] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">
        CB: 99.9<span className="lowercase">MM</span>
      </p>
    </div>
  );
}

function Container1() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Label />
    </div>
  );
}

function Size() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Size">
      <Container />
      <Container1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <ProductBrand />
      <ProductModel />
      <Size />
    </div>
  );
}

function ImageWithFallback() {
  return (
    <div className="bg-white h-[193px] relative rounded-[16px] shrink-0 w-full" data-name="ImageWithFallback">
      <div className="h-[193px] overflow-clip relative rounded-[inherit] w-full">
        <div className="absolute left-1/2 size-[180px] top-[8px] translate-x-[-50%]" data-name="image 5">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage5} />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(229,231,235,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function LucideEuro() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="lucide/euro">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="lucide/euro">
          <path d={svgPaths.p4b3b540} id="Vector" stroke="var(--stroke-0, #FF6B35)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Value() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Value">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[28px] not-italic relative shrink-0 text-[#101828] text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre">9999.99</p>
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-end relative w-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#6a7282] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">99,999.99 €/4PCS</p>
      </div>
    </div>
  );
}

function Price() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Price">
      <LucideEuro />
      <Value />
      <Label1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#ffd6a7] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[16px] items-start p-[12px] relative w-full">
          <Price />
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container3 />
    </div>
  );
}

function Label2() {
  return (
    <div className="capitalize content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[2px] items-center justify-center leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] whitespace-pre" data-name="Label">
      <p className="relative shrink-0">Color:</p>
      <p className="relative shrink-0">Gunmetal</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Label2 />
    </div>
  );
}

function Label3() {
  return (
    <div className="capitalize content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[2px] items-center justify-center leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] whitespace-pre" data-name="Label">
      <p className="relative shrink-0">Material:</p>
      <p className="relative shrink-0">Aluminum</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Label3 />
    </div>
  );
}

function FunctionList() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Function list">
      <Container5 />
      <Container6 />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_201_4500)" id="Icon">
          <path d={svgPaths.p22b32180} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pceec000} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p35e3f800} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_201_4500">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TireCard() {
  return (
    <div className="h-[20px] relative shrink-0 w-[26.602px]" data-name="TireCard">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] relative w-[26.602px]">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[14px] text-nowrap text-white top-[0.5px] tracking-[-0.2904px] whitespace-pre">Add</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#ff6b35] box-border content-stretch flex gap-[14px] h-[40px] items-center justify-center relative rounded-[25px] shadow-[0px_4px_12px_0px_rgba(255,107,53,0.25)] shrink-0 w-full" data-name="Button">
      <Icon />
      <TireCard />
    </div>
  );
}

function Bottom() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Bottom">
      <FunctionList />
      <Button />
    </div>
  );
}

function ImageAndLabel() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Image and Label">
      <ImageWithFallback />
      <Container4 />
      <Bottom />
    </div>
  );
}

export default function RimCard() {
  return (
    <div className="bg-gray-50 relative rounded-[24px] size-full" data-name="RimCard">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip p-[24px] relative size-full">
          <Container2 />
          <ImageAndLabel />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(229,231,235,0.8)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}