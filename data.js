const SITE = {
 user: 'kaelyn',
 host: 'web',
 whoami: 'hey hey, i\'m kaelyn! i like making cool stuff',
 neofetch: [
   ['os', 'kaelyn-os 1.0'],
   ['role', 'software engineer'],
   ['location', 'new york city'],
   ['languages', 'python, javascript, c++, ruby, go'],
   ['currently', 'interning @ shopify nyc'],
 ],
};


const FS = {
 type: 'dir',
 children: {
   'about.txt': {
     type: 'file',
     content: `hi, i'm kaelyn :)

i'm a programmer. 
i like building small, thoughtful things.
i love software that feels nice to use.

right now:
 - wandering @ new york city
 - interning @ shopify
 - learning @ uwaterloo

this is my website! poke around, have fun :D 
double click the folders, peek around files
or feel free to open the terminal if you'd rather type.

ps: there are hidden files in here ;)
`,
   },

   projects: {
     type: 'dir',
     children: {
       'personal_website': {
         type: 'dir',
         meta: { kind: 'website', created: 'Nov 2026' },
         children: {
           'README.md': {
             type: 'file',
             content: `# personal website

a personal site that pretends to be a computer!

## why
i wanted my website to feel like poking around someone's desktop. 
you can pick what you want to see, drag things around, the experience is wholly yours

## how it works
- the whole file system is one js object in data.js
- finder windows and the terminal read the same tree
- cd in the terminal moves your finder window too
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['javascript', 'html', 'css'],
               tools: ['claude code'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/projects' },
         },
       },

       'FIFA_optimization': {
         type: 'dir',
         meta: { kind: 'model', created: 'Aug 2026' },
         children: {
           'README.md': {
             type: 'file',
             content: `# FIFA group stage optimization

## why
final project for my modelling in operations research course.
based off the Canadian Operational Research Society (CORS) OR Challenge 2026

## how it works
- outputs the group stage matches for the FIFA 2026 world cup optimized for weather, travel times, and minimal time zone crossings
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['python'],
               libraries_and_frameworks: ['gurobi'],
             },
           },
           src: { type: 'link', href: 'https://github.com/gurmansahota/fifa-optimization-model' },
         },
       },

       'rock_paper_scissors': {
         type: 'dir',
         meta: { kind: 'website', created: 'Dec 2025' },
         children: {
           'README.md': {
             type: 'file',
             content: `# rock, paper, scissors

play rock, paper, scissors against your computer!

## why
i was pretty bored after my first term at university and spent
a lot of time playing rock, paper, scissors with my younger cousin
(that's the only game she knew). I wanted to learn a bit more about
computer vision and machine learning so i made a little website i could play against

## how it works
- collected hand data with OpenCV and MediaPipe
- extended the dataset with data augmentation techniques
- trained a model with tensorflow to classify gestures with 96% accuracy
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['python'],
               libraries_and_frameworks: ['mediapipe', 'tensorflow', 'openCV', 'flask'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/rockpaperscissors' },
         },
       },

       'my_gut_feeling': {
         type: 'dir',
         meta: { kind: 'website', created: 'Nov 2025' },
         children: {
           'README.md': {
             type: 'file',
             content: `# my gut feeling

## why
as part of the University of Waterloo's Women in Engineering Fall 2025 hackathon
my team and I created a system for food-tracking and symptom-logging to help users 
understand how their diet may be affecting their digestive health.

## how it works
- it allows users to record meals and symptoms daily, and then analyzes the data to detect patterns or possible trigger foods
- the system generates a clear and organized report that can be securely shared with a healthcare professional
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['javascript', 'typescript', 'css'],
               libraries_and_frameworks: ['node.js', 'express.js', 'prisma', 'SQLite'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/the-summer-i-lost-belly' },
         },
       },

       'movie_reviews': {
         type: 'dir',
         meta: { kind: 'website', created: 'summer 2026' },
         children: {
           'README.md': {
             type: 'file',
             content: `# movie review site

## why
final project for my databases and software design course
a website where you can review films

## how it works
- API calls are made to a seperate databse that stores the movies and reviews
- users are able to choose from a list to add reviews and edit previous reviews
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['javascript', 'SQL'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/movie-review' },
         },
       },

       'FIFA_winner_predictor': {
         type: 'dir',
         meta: { kind: 'website', created: 'summer 2026' },
         children: {
           'README.md': {
             type: 'file',
             content: `# FIFA winner predictor

## why
my friend and i go crazy over the world cup. and luckily i was in school this summer
so i was able to watch most of the matches. but i wanted my favorite team (england) to win.
and i was confident they would, i just needed proof...

## how it works
- collected and cleaned historical FIFA data on elo ratings, team rankings, group standings, player stats, squad info,
and winning bets from DraftKings sportsbook odds
- we were to train a model based on this to predict the winner (unfortunately did not end up finishing before the final match)
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['python'],
               libraries_and_frameworks: ['numpy', 'pandas', 'xgboost'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/jude-bellingham' },
         },
       },
       'jello': {
         type: 'dir',
         meta: { kind: 'website', created: 'summer 2026' },
         children: {
           'README.md': {
             type: 'file',
             content: `# jello

## why
i really like jello

## how it works
- simulating physically accurate jello jiggles with three.js
`,
           },
           'stack.json': {
             type: 'file',
             content: {
               languages: ['javascript'],
               libraries_and_frameworks: ['three.js'],
             },
           },
           src: { type: 'link', href: 'https://github.com/k2pereir/jello' },
         },
       },
     },


   },
   'resume.pdf': {
     type: 'file',
     content: `# kaelyn pereira
software engineer · new york city · k2pereir@uwaterloo.ca


---

## Experience
**Software Engineer**, Shopify · Sept 2026 - Dec 2026
- intern on the commerce, trust, & integrity team under the security subdiscipline
- built the framework for legal analysts to streamline the investigation of money laundering incidents

**Sofware Engineer**, Shopify · Jan 2026 - April 2026
- intern on the search & tooling team under the machine learning subdiscipline
- investigated how internal search relevance models compare to competing systems

**Sofware Engineer**, AMD · July 2025 - Aug 2025
- intern under the AI program 
- developed a retrieval-augmented generation system for AI assisted log analysis

**Technical Product Marketer**, Untether AI · July 2025 - Aug 2025
- intern on the Product team
- created technical explainers illustrating AI model deployment on custom hardware

## Education
**[Management Engineering, Artificial Intelligence Specialization]**, [University of Waterloo]

## Skills
Languages - Python, JavaScript, Java, C++, C#, SQL, R, HTML/CSS

Frameworks & Development - React, Next.js, Flask, ROS 2, Unity

ML & Data Sci - PyTorch, TensorFlow, Keras, scikit-learn, Pandas, NumPy, OpenCV

Cloud & DevOps - Google Cloud Platform (GCP), Docker, Kubernetes, Git

Data - Apache Airflow, BigQuery`,
   },
   'contact.txt': {
     type: 'file',
     content: `say hi!


email     k2pereir@uwaterloo.ca
github    https://github.com/k2pereir
linkedin  https://www.linkedin.com/in/kaelyn-pereira/
`,
   },


   'terminal.app': { type: 'app', app: 'terminal' },


   '.secrets': {
     type: 'dir',
     children: {
       'fun-fact.txt': {
         type: 'file',
         content: `fun fact! i have a substack! 

the articles are very much NOT proofread, i really only write for my own learning :) 
         
but feel free to check it out here - https://substack.com/@kabbbbb
`,
       },
       'you-found-it.md': {
         type: 'file',
         content: `# you found it lol

thanks for poking around :)`,
       },
     },
   },
 },
}