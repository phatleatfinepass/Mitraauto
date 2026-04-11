import svgPaths from "./svg-eon971h5o4";
import imgImage from "figma:asset/adb78c34e0828008e64c9fd199a33b3043beba86.png";

function ProductBrand() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="product.brand">
      <p className="basis-0 font-['Inter:Semi_Bold',sans-serif] font-semibold grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#101828] text-[24px] tracking-[-0.7125px]">Continental</p>
    </div>
  );
}

function ProductModel() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="product.model">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#4a5565] text-[14px] text-nowrap tracking-[-0.1784px] whitespace-pre">ECO5E</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[8px] items-center leading-[20px] not-italic relative rounded-[16px] shrink-0 text-[#101828] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre" data-name="Container">
      <p className="relative shrink-0">205</p>
      <p className="relative shrink-0">/</p>
      <p className="relative shrink-0">55</p>
      <p className="relative shrink-0">R16</p>
      <p className="relative shrink-0">91V</p>
    </div>
  );
}

function LucideSun() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="lucide/sun">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_201_4497)" id="lucide/sun">
          <path d={svgPaths.p1af8b380} id="Vector" stroke="var(--stroke-0, #101828)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_201_4497">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Label() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[#101828] text-[12px] text-center text-nowrap uppercase whitespace-pre">Summer</p>
      </div>
    </div>
  );
}

function Type() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center p-[2px] relative shrink-0" data-name="Type">
      <LucideSun />
      <Label />
    </div>
  );
}

function Size() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Size">
      <Container />
      <Type />
    </div>
  );
}

function Container1() {
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
    <div className="aspect-[248/157] bg-white relative rounded-[16px] shrink-0 w-full" data-name="ImageWithFallback">
      <div className="aspect-[248/157] overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute left-1/2 size-[286px] top-[16px] translate-x-[-50%]" data-name="Image">
          <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage} />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(229,231,235,0.5)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p6a97700} id="Vector" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p28f0ce80} id="Vector_2" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M1.33315 14H9.99981" id="Vector_3" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M2 6H9.33333" id="Vector_4" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Value() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Value">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] not-italic relative shrink-0 text-[#101828] text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre">99</p>
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#6a7282] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">fuel</p>
      </div>
    </div>
  );
}

function Fuel() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]" data-name="Fuel">
      <Icon />
      <Value />
      <Label1 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p23197080} id="Vector" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p24cd0280} id="Vector_2" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Value1() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Value">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] not-italic relative shrink-0 text-[#101828] text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre">D</p>
      </div>
    </div>
  );
}

function Label2() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#6a7282] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">WeT</p>
      </div>
    </div>
  );
}

function Wet() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]" data-name="Wet">
      <Icon1 />
      <Value1 />
      <Label2 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p17ed0900} id="Vector" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1ef0e180} id="Vector_2" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p37402580} id="Vector_3" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Value2() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Value">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] not-italic relative shrink-0 text-[#101828] text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre">66</p>
      </div>
    </div>
  );
}

function Label3() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#6a7282] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">DB</p>
      </div>
    </div>
  );
}

function Wet1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] h-full items-center relative shrink-0 w-[21.016px]" data-name="Wet">
      <Icon2 />
      <Value2 />
      <Label3 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex h-[64px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Fuel />
      <Wet />
      <Wet1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#bedbff] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start p-[12px] relative w-full">
          <Container2 />
        </div>
      </div>
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

function Value3() {
  return (
    <div className="h-[26px] relative shrink-0" data-name="Value">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[10px] h-[26px] items-center justify-center relative">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[28px] not-italic relative shrink-0 text-[#101828] text-[18px] text-center text-nowrap tracking-[-0.4395px] whitespace-pre">9999.99</p>
      </div>
    </div>
  );
}

function Label4() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#6a7282] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">99,999.99 €/4PCS</p>
      </div>
    </div>
  );
}

function Price() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Price">
      <LucideEuro />
      <Value3 />
      <Label4 />
    </div>
  );
}

function Container4() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#ffd6a7] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start p-[12px] relative w-full">
          <Price />
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container4 />
    </div>
  );
}

function Label5() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">EV READY</p>
      </div>
    </div>
  );
}

function Fuel1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Fuel">
      <Label5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Fuel1 />
    </div>
  );
}

function Label6() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">XL</p>
      </div>
    </div>
  );
}

function Fuel2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Fuel">
      <Label6 />
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Fuel2 />
    </div>
  );
}

function Label7() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">Runflat</p>
      </div>
    </div>
  );
}

function Fuel3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Fuel">
      <Label7 />
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Fuel3 />
    </div>
  );
}

function Label8() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[10px] items-center justify-center relative">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[13.5px] not-italic relative shrink-0 text-[#99a1af] text-[9px] text-center text-nowrap tracking-[0.167px] uppercase whitespace-pre">Studded</p>
      </div>
    </div>
  );
}

function Fuel4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Fuel">
      <Label8 />
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[rgba(250,250,250,0.2)] box-border content-stretch flex gap-[8px] items-center px-[8px] py-[4px] relative rounded-[8px] shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(106,114,130,0.3)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Fuel4 />
    </div>
  );
}

function FunctionList() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Function list">
      <Container6 />
      <Container7 />
      <Container8 />
      <Container9 />
    </div>
  );
}

function Icon3() {
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
      <Icon3 />
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
      <Container5 />
      <Bottom />
    </div>
  );
}

export default function TireCard1() {
  return (
    <div className="bg-gray-50 relative rounded-[24px] size-full" data-name="TireCard">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start overflow-clip p-[24px] relative size-full">
          <Container1 />
          <ImageAndLabel />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(229,231,235,0.8)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}