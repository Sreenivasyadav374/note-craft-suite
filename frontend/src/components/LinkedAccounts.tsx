import { useAuthContext } from '@/context/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mail, CheckCircle2 } from 'lucide-react';

export function LinkedAccounts() {
  const { userProfile } = useAuthContext();
  const authMethod = localStorage.getItem('authMethod') || 'email';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Linked Accounts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your connected accounts and authentication methods
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">Email & Password</div>
              <div className="text-sm text-muted-foreground">{userProfile?.email}</div>
            </div>
          </div>
          {authMethod === 'email' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Active
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium">Google</div>
              <div className="text-sm text-muted-foreground">
                {authMethod === 'google' ? userProfile?.email : 'Not connected'}
              </div>
            </div>
          </div>
          {authMethod === 'google' ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Active
            </div>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          )}
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Your account is secured with {authMethod === 'google' ? 'Google authentication' : 'email and password'}.</p>
      </div>
    </div>
  );
}
