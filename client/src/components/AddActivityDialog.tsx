import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, type InsertTripActivity, type Activity } from "@shared/routes";
import { insertTripActivitySchema } from "@shared/schema";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Loader2, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddActivityDialogProps {
    tripId: number;
    stopId: number;
    trigger?: React.ReactNode;
}

export default function AddActivityDialog({ tripId, stopId, trigger }: AddActivityDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");

    const { data: searchResults } = useQuery<Activity[]>({
        queryKey: ["activity-search", search],
        queryFn: async () => {
            const res = await fetch(`/api/activities/search?q=${search}`);
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: search.length > 2,
    });

    const form = useForm<Omit<InsertTripActivity, "tripId" | "stopId">>({
        resolver: zodResolver(insertTripActivitySchema.omit({ tripId: true, stopId: true })),
        defaultValues: {
            title: "",
            description: "",
            activityId: 1,
            scheduledDate: new Date(),
            cost: "0",
            duration: 60,
            notes: "",
            orderIndex: 0,
        },
    });

    const selectGlobalActivity = (activity: Activity) => {
        form.setValue("title", activity.name);
        form.setValue("description", activity.description || "");
        form.setValue("cost", activity.defaultCost?.toString() || "0");
        form.setValue("activityId", activity.id);
        setSearch("");
    };

    const mutation = useMutation({
        mutationFn: async (data: Omit<InsertTripActivity, "tripId" | "stopId">) => {
            const res = await fetch(`/api/trip-stops/${stopId}/activities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, tripId, stopId }),
            });
            if (!res.ok) throw new Error("Failed to add activity");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", stopId] });
            queryClient.invalidateQueries({ queryKey: ["activities", "all", String(tripId)] });
            queryClient.invalidateQueries({ queryKey: ["trip", String(tripId)] });
            toast({
                title: "Activity added",
                description: "Your activity has been added to the itinerary.",
            });
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                        <Plus className="w-3 h-3" />
                        Add Activity
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Activity</DialogTitle>
                    <DialogDescription>
                        Search our library or enter details manually.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 pt-4">
                    <FormLabel>Quick Discovery</FormLabel>
                    <Input
                        placeholder="Search popular activities (e.g. Eiffel Tower)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-primary/5 border-primary/20"
                    />
                    {searchResults && searchResults.length > 0 && (
                        <Card className="absolute z-50 w-[calc(100%-48px)] mt-1 shadow-lg">
                            <CardContent className="p-2 space-y-1">
                                {searchResults.map((act) => (
                                    <Button
                                        key={act.id}
                                        variant="ghost"
                                        className="w-full justify-start text-left h-auto py-2 px-3 gap-2"
                                        onClick={() => selectGlobalActivity(act)}
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold">{act.name}</div>
                                            <div className="text-xs text-muted-foreground">{act.category} - ${act.defaultCost}</div>
                                        </div>
                                        <Plus className="w-4 h-4 text-primary" />
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activity Title</FormLabel>
                                    <FormControl>
                                        <Input id="activity-title" placeholder="e.g. Visit Eiffel Tower" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date & Time</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    id="activity-date-button"
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP p")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost ($)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input id="activity-cost" type="number" step="0.01" className="pl-8" {...field} value={field.value ?? ""} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (min)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" className="pl-8" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="What will you do?" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button id="submit-activity-button" type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add to Itinerary
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
