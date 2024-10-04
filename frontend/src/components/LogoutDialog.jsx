import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { LogOut } from "lucide-react"; 

const LogoutDialog = ({ logout}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false); 
  };

  return (
    <>
      {/* Logout Button */}
      <Button
        variant="destructive"
        className="flex items-center space-x-2"
        onClick={() => setIsOpen(true)} 
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </Button>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild />
        <DialogContent>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to logout?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

LogoutDialog.propTypes = {
  logout: PropTypes.func.isRequired,  // Validate logout as a required function
};

export default LogoutDialog;
