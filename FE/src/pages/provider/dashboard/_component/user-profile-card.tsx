import { Card, CardContent } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Book, CheckCircle, Eye } from "lucide-react";

export default function UserProfileCard() {
  return (
    <Card className="relative overflow-hidden rounded-lg shadow-sm">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent)] rounded-bl-full flex items-end justify-start p-2">
        <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
          <div className="w-10 h-10 bg-[var(--color-fourth)] rounded-full"></div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[60px] border-t-transparent border-r-[60px] border-r-[var(--color-secondary)]"></div>
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-transparent border-r-[40px] border-r-[var(--color-primary)]"></div>
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-transparent border-r-[20px] border-r-[var(--color-accent)]"></div>

      <CardContent className="p-6 pt-16 flex flex-col items-center text-center">
        {/* <h2 className="text-xl font-semibold mb-4 w-full text-left">Profile</h2>
        <Avatar className="w-24 h-24 mb-4 border-4 border-white shadow-md">
          <AvatarImage src="/images/profile.png" alt="Kari wiza" />
          <AvatarFallback>KW</AvatarFallback>
        </Avatar> */}
        <h3 className="text-lg font-bold text-gray-800">Kari wiza</h3>
        <p className="text-sm text-gray-500 mb-4">@Kari_wiza@001</p>
        <div className="flex space-x-2 mb-6">
          <Button className="bg-[var(--color-skyblue)] hover:bg-[var(--color-lightskyblue)] text-white rounded-md px-4 py-2">
            Follow
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 rounded-md px-4 py-2 bg-transparent"
          >
            View Profile
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {' "Crafting a Path of Knowledge, Innovation, and Excellence."'}
        </p>
        <div className="grid grid-cols-4 gap-4 w-full">
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
            <Clock className="w-5 h-5 text-[var(--color-skyblue)] mb-1" />
            <span className="text-sm font-semibold text-[var(--color-skyblue)]">
              45H
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
            <Book className="w-5 h-5 text-gray-600 mb-1" />
            <span className="text-sm font-semibold text-gray-600">10</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
            <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
            <span className="text-sm font-semibold text-green-500">2K</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
            <Eye className="w-5 h-5 text-purple-500 mb-1" />
            <span className="text-sm font-semibold text-purple-500">34K</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
