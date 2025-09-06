interface Property {
  trait_type: string;
  value: string | number;
  display_type?: string;
  rarity?: number; // percentage
}

interface NFTPropertiesProps {
  properties: Property[];
}

export function NFTProperties({ properties }: NFTPropertiesProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No properties available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {properties.map((property, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
        >
          <div className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">
            {property.trait_type}
          </div>
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {property.display_type === 'date' 
              ? new Date(Number(property.value) * 1000).toLocaleDateString()
              : property.value
            }
          </div>
          {property.rarity && (
            <div className="text-xs text-gray-500">
              {property.rarity}% have this trait
            </div>
          )}
        </div>
      ))}
    </div>
  );
}