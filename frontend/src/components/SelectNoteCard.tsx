import React from 'react';
// Import your UI components
import { Card, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
// Import Lucide icons
import { FileText, Plus } from 'lucide-react'; 

// Define the interface for the props (it needs the createNewNote function)
interface SelectNoteCardProps {
  createNewNote: () => void; // Assuming it returns void, based on its use
}

// Define the component using the props interface
const SelectNoteCard: React.FC<SelectNoteCardProps> = ({ createNewNote }) => {
    return (
        <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)]">
            <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        Select an item to view
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Choose an item from the sidebar or create a new one to get
                        started.
                    </p>
                    <Button
                        onClick={createNewNote} // Use the prop
                        className="bg-gradient-primary hover:opacity-90"
                        title="New Note"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Note
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default SelectNoteCard;