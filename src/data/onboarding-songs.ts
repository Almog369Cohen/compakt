export interface QuickStartSong {
  title: string;
  artist: string;
  genre: string;
  isActive: boolean;
}

export const QUICK_START_SONGS: QuickStartSong[] = [
  // ישראלי פופולרי
  { title: "שיר של יום חמישי", artist: "חנן בן ארי", genre: "ישראלי", isActive: true },
  { title: "בואי", artist: "עומר אדם", genre: "ישראלי", isActive: true },
  { title: "תודה", artist: "עידן רייכל", genre: "ישראלי", isActive: true },
  { title: "אהבה ראשונה", artist: "משינה", genre: "ישראלי", isActive: true },
  { title: "יפה שלי", artist: "סאבלימינל", genre: "ישראלי", isActive: true },
  { title: "את", artist: "אביב גפן", genre: "ישראלי", isActive: true },
  { title: "רוקדת לי לבד", artist: "נועה קירל", genre: "ישראלי", isActive: true },
  { title: "אם תרצי", artist: "אייל גולן", genre: "ישראלי", isActive: true },
  { title: "חלומות", artist: "שלמה ארצי", genre: "ישראלי", isActive: true },
  { title: "מילים", artist: "הדג נחש", genre: "ישראלי", isActive: true },
  
  // מזרחי
  { title: "לילה טוב", artist: "סטטיק ובן אל", genre: "מזרחי", isActive: true },
  { title: "תודה", artist: "אייל גולן", genre: "מזרחי", isActive: true },
  { title: "מלאך", artist: "עומר אדם", genre: "מזרחי", isActive: true },
  { title: "שתי דקות", artist: "זמר", genre: "מזרחי", isActive: true },
  { title: "אהבה שלי", artist: "משה פרץ", genre: "מזרחי", isActive: true },
  
  // Pop בינלאומי
  { title: "Perfect", artist: "Ed Sheeran", genre: "Pop", isActive: true },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", genre: "Pop", isActive: true },
  { title: "All of Me", artist: "John Legend", genre: "Pop", isActive: true },
  { title: "A Thousand Years", artist: "Christina Perri", genre: "Pop", isActive: true },
  { title: "Marry You", artist: "Bruno Mars", genre: "Pop", isActive: true },
  { title: "Can't Stop the Feeling", artist: "Justin Timberlake", genre: "Pop", isActive: true },
  { title: "Happy", artist: "Pharrell Williams", genre: "Pop", isActive: true },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Pop", isActive: true },
  { title: "Shape of You", artist: "Ed Sheeran", genre: "Pop", isActive: true },
  { title: "Love Story", artist: "Taylor Swift", genre: "Pop", isActive: true },
  
  // רוק קלאסי
  { title: "Don't Stop Believin'", artist: "Journey", genre: "Rock", isActive: true },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", genre: "Rock", isActive: true },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", genre: "Rock", isActive: true },
  { title: "I Wanna Dance with Somebody", artist: "Whitney Houston", genre: "Rock", isActive: true },
  { title: "September", artist: "Earth, Wind & Fire", genre: "Funk", isActive: true },
  
  // דאנס / אלקטרוני
  { title: "Wake Me Up", artist: "Avicii", genre: "Dance", isActive: true },
  { title: "Levels", artist: "Avicii", genre: "Dance", isActive: true },
  { title: "Titanium", artist: "David Guetta ft. Sia", genre: "Dance", isActive: true },
  { title: "Don't You Worry Child", artist: "Swedish House Mafia", genre: "Dance", isActive: true },
  { title: "Animals", artist: "Martin Garrix", genre: "Dance", isActive: true },
  
  // R&B / Soul
  { title: "At Last", artist: "Etta James", genre: "Soul", isActive: true },
  { title: "Crazy in Love", artist: "Beyoncé", genre: "R&B", isActive: true },
  { title: "Isn't She Lovely", artist: "Stevie Wonder", genre: "Soul", isActive: true },
  { title: "Stand by Me", artist: "Ben E. King", genre: "Soul", isActive: true },
  { title: "What a Wonderful World", artist: "Louis Armstrong", genre: "Jazz", isActive: true },
  
  // קלאסיקות חתונה
  { title: "Hava Nagila", artist: "Traditional", genre: "Traditional", isActive: true },
  { title: "Siman Tov Mazal Tov", artist: "Traditional", genre: "Traditional", isActive: true },
  { title: "Od Yishama", artist: "Traditional", genre: "Traditional", isActive: true },
  { title: "Dodi Li", artist: "Traditional", genre: "Traditional", isActive: true },
  { title: "Erev Shel Shoshanim", artist: "Traditional", genre: "Traditional", isActive: true },
  
  // נוספים פופולריים
  { title: "Counting Stars", artist: "OneRepublic", genre: "Pop", isActive: true },
  { title: "Shut Up and Dance", artist: "Walk the Moon", genre: "Pop", isActive: true },
  { title: "24K Magic", artist: "Bruno Mars", genre: "Funk", isActive: true },
  { title: "Treasure", artist: "Bruno Mars", genre: "Funk", isActive: true },
  { title: "Best Day of My Life", artist: "American Authors", genre: "Pop", isActive: true },
];

export const QUICK_START_SONGS_COUNT = QUICK_START_SONGS.length;
