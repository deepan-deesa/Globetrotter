import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus } from "lucide-react";

export default function ItineraryBuilder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Itinerary Builder</h1>
        <p className="text-muted-foreground mt-1">
          Plan your trip day by day with drag-and-drop itinerary building
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Build Your Itinerary</CardTitle>
          <CardDescription>
            Add stops and activities to create your perfect trip plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Building</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a trip to start adding stops and activities. You can drag and drop to reorder your itinerary.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="gap-2">
                <MapPin className="w-4 h-4" />
                Add Stop
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
