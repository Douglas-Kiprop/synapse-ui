import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Trash2 } from "lucide-react";
import { NotificationPreferences } from "@/types/strategy";

interface GlobalSettingsProps {
    name: string;
    setName: (n: string) => void;
    description: string;
    setDescription: (d: string) => void;
    schedule: string;
    setSchedule: (s: string) => void;
    assets: string[];
    addAsset: (a: string) => void;
    removeAsset: (a: string) => void;
    notificationPreferences: NotificationPreferences;
    setNotificationPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
    name, setName, description, setDescription, schedule, setSchedule, 
    assets, addAsset, removeAsset, notificationPreferences, setNotificationPreferences
}) => {
    return (
        <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Settings className="w-4 h-4" /> Global Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-2">
                        <Label>Strategy Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BTC Breakout Strategy" className="bg-background" />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                        <Label>Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. This strategy identifies breakout opportunities..." className="bg-background" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Schedule</Label>
                        <Select value={schedule} onValueChange={setSchedule}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1m">1 Min</SelectItem>
                                <SelectItem value="5m">5 Min</SelectItem>
                                <SelectItem value="1h">1 Hour</SelectItem>
                                <SelectItem value="24h">Daily</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                        <Label>Assets</Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
                            {assets.map(a => (
                                <Badge key={a} variant="secondary" className="gap-1 pl-2.5 py-1 text-xs">
                                    {a}
                                    <Trash2 className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeAsset(a)} />
                                </Badge>
                            ))}
                            <Select onValueChange={addAsset}>
                                <SelectTrigger className="w-[110px] h-6 border-none shadow-none text-xs text-muted-foreground"><SelectValue placeholder="+ Add Asset" /></SelectTrigger>
                                <SelectContent>{["BTC", "ETH", "SOL", "AVAX", "MATIC"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="md:col-span-12 space-y-2">
                        <Label>Notifications</Label>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border rounded-md bg-background">
                            <div className="md:col-span-3 flex items-center gap-2">
                                <Checkbox
                                    checked={notificationPreferences?.cooldown?.enabled ?? false}
                                    onCheckedChange={(checked) => {
                                        setNotificationPreferences(prev => ({
                                            ...prev,
                                            cooldown: {
                                                enabled: !!checked,
                                                duration_value: prev.cooldown?.duration_value ?? 1,
                                                duration_unit: prev.cooldown?.duration_unit ?? "h",
                                            }
                                        }));
                                    }}
                                />
                                <span className="text-sm">Enable Cooldown</span>
                            </div>

                            {notificationPreferences?.cooldown?.enabled && (
                                <>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Duration Value</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={notificationPreferences.cooldown?.duration_value ?? 1}
                                            onChange={(e) =>
                                                setNotificationPreferences(prev => ({
                                                    ...prev,
                                                    cooldown: {
                                                        ...prev.cooldown,
                                                        duration_value: Number(e.target.value) || 0,
                                                    }
                                                }))
                                            }
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Duration Unit</Label>
                                        <Select
                                            value={notificationPreferences.cooldown?.duration_unit ?? "h"}
                                            onValueChange={(v) =>
                                                setNotificationPreferences(prev => ({
                                                    ...prev,
                                                    cooldown: {
                                                        ...prev.cooldown,
                                                        duration_unit: v as "s" | "m" | "h" | "d",
                                                    }
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="s">Seconds</SelectItem>
                                                <SelectItem value="m">Minutes</SelectItem>
                                                <SelectItem value="h">Hours</SelectItem>
                                                <SelectItem value="d">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default GlobalSettings;