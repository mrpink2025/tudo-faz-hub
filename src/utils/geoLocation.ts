interface IPLocationResponse {
  country_code: string;
  country: string;
  region?: string;
}

// Mapear códigos de país para idiomas suportados
const countryToLanguageMap: Record<string, string> = {
  // Português
  'BR': 'pt', // Brasil
  'PT': 'pt', // Portugal
  'AO': 'pt', // Angola
  'MZ': 'pt', // Moçambique
  'CV': 'pt', // Cabo Verde
  'GW': 'pt', // Guiné-Bissau
  'ST': 'pt', // São Tomé e Príncipe
  'TL': 'pt', // Timor-Leste
  'MO': 'pt', // Macau
  
  // Espanhol
  'ES': 'es', // Espanha
  'MX': 'es', // México
  'AR': 'es', // Argentina
  'CO': 'es', // Colômbia
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  'CL': 'es', // Chile
  'EC': 'es', // Equador
  'GT': 'es', // Guatemala
  'CU': 'es', // Cuba
  'BO': 'es', // Bolívia
  'DO': 'es', // República Dominicana
  'HN': 'es', // Honduras
  'PY': 'es', // Paraguai
  'SV': 'es', // El Salvador
  'NI': 'es', // Nicarágua
  'CR': 'es', // Costa Rica
  'PA': 'es', // Panamá
  'UY': 'es', // Uruguai
  'GQ': 'es', // Guiné Equatorial
  
  // Chinês
  'CN': 'zh', // China
  'TW': 'zh', // Taiwan
  'HK': 'zh', // Hong Kong
  'SG': 'zh', // Singapura (tem chinês)
  
  // Inglês como fallback para outros países
};

export const detectLanguageByIP = async (): Promise<string | null> => {
  try {
    // Usar ipapi.co como API gratuita de geolocalização
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    
    const data: IPLocationResponse = await response.json();
    
    if (data.country_code) {
      const detectedLanguage = countryToLanguageMap[data.country_code.toUpperCase()];
      console.log(`Detected country: ${data.country} (${data.country_code}), Language: ${detectedLanguage || 'not mapped'}`);
      return detectedLanguage || null;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to detect language by IP:', error);
    return null;
  }
};

export const detectLanguageByIPWithFallback = async (): Promise<string> => {
  // Primeiro tenta detectar por IP
  const ipLanguage = await detectLanguageByIP();
  if (ipLanguage) {
    return ipLanguage;
  }
  
  // Fallback para localStorage
  try {
    const stored = localStorage.getItem("lang");
    if (stored) return stored;
  } catch {}
  
  // Fallback para navigator.language
  const nav = (navigator.language || "pt").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("en")) return "en";
  
  // Fallback final
  return "pt";
};