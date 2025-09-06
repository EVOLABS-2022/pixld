import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Tag, 
  RefreshCw, 
  Gavel,
  ArrowUpDown,
  Heart,
  ExternalLink 
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'mint' | 'sale' | 'transfer' | 'listing' | 'offer' | 'bid' | 'cancel';
  price?: string;
  currency?: string;
  currencySymbol?: string;
  from?: {
    id: string;
    address: string;
    displayName?: string;
  };
  to?: {
    id: string;
    address: string;
    displayName?: string;
  };
  timestamp: number;
  transactionHash?: string;
}

interface ActivityProps {
  activity: ActivityItem[];
}

const activityIcons = {
  mint: RefreshCw,
  sale: ShoppingCart,
  transfer: ArrowUpDown,
  listing: Tag,
  offer: Heart,
  bid: Gavel,
  cancel: ExternalLink,
};

const activityColors = {
  mint: 'text-green-600',
  sale: 'text-blue-600',
  transfer: 'text-purple-600',
  listing: 'text-orange-600',
  offer: 'text-pink-600',
  bid: 'text-yellow-600',
  cancel: 'text-gray-600',
};

const activityLabels = {
  mint: 'Minted',
  sale: 'Sold',
  transfer: 'Transferred',
  listing: 'Listed',
  offer: 'Offer made',
  bid: 'Bid placed',
  cancel: 'Cancelled',
};

export function Activity({ activity }: ActivityProps) {
  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-gray-400 mb-4">
          <RefreshCw className="h-12 w-12 mx-auto" />
        </div>
        <div className="text-lg font-medium text-gray-900 mb-2">
          No activity yet
        </div>
        <div className="text-gray-600">
          Activity for this NFT will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activity.map((item) => {
            const Icon = activityIcons[item.type];
            const colorClass = activityColors[item.type];
            const label = activityLabels[item.type];
            
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.price ? (
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">
                        Ξ{item.price}
                      </span>
                      {item.currencySymbol && item.currencySymbol !== 'ETH' && (
                        <Badge variant="outline" className="text-xs">
                          {item.currencySymbol}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.from ? (
                    <Link 
                      href={`/users/${item.from.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {item.from.displayName || 
                       `${item.from.address.slice(0, 6)}...${item.from.address.slice(-4)}`}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.to ? (
                    <Link 
                      href={`/users/${item.to.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {item.to.displayName || 
                       `${item.to.address.slice(0, 6)}...${item.to.address.slice(-4)}`}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(item.timestamp * 1000).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {item.transactionHash ? (
                    <a
                      href={`https://etherscan.io/tx/${item.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}