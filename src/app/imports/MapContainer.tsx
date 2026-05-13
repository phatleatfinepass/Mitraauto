import { useTheme } from '../components/ThemeContext';
import mapImageLight from 'figma:asset/e954c70ab138fb6c5af10ceabd8d779e68047d5d.png';
import mapImageDark from 'figma:asset/8204366cdd338c064d2e5f81eda8c7d2bffb439c.png';

export default function MapContainer() {
  const { theme } = useTheme();
  
  // Determine which map to show based on theme
  const mapImage = theme === 'dark' ? mapImageDark : mapImageLight;
  
  return (
    <div className="relative size-full w-full h-full" data-name="Map Container">
      <img 
        src={mapImage} 
        alt="Map showing location at Hankasuontie 5, Helsinki"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
