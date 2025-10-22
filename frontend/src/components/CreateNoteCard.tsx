import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const CreateNoteCard = ({notesLength}) => {
  return(
    <Card className="shadow-card border-0 bg-gradient-card">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {notesLength === 0
                            ? "No items yet. Create your first note or folder!"
                            : "No items found in this location."}
                        </p>
                      </CardContent>
                    </Card>
  )};
  export default CreateNoteCard;
