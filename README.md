SNJS Javascript text paser for node.js
=======================================

THERE ARE MANY BUGS AND MISSING FEATURES.


  - [MANUAL](http://snjs.springnote.com/)


CHANGELOGS
==========

v0.0.03pa
---------

With some features added.

*   BAD ENGLISH : [CHANGE] excute -> execute O_o; excute?!!#%$!% excuse! ~.~
*   SNJS.js : [CHANGE] "INCLUDE" object is added to the CONNECTOR. (parent, files) 
*   SNJS.js : [INFO] snjs.codebox.create and snjs.collect name will be changed. 
*   SNJS.js : [NEW] Added trimFile function for checking file by BASE_DIRECOTORY and LOCK_DIRECTORY option.
*   SNJS.js : [CHANGE] Defined two error type. Soft - Warn and continue execute script, Normal - Stop running the code. 
*   SNJS.js : [CHANGE] Once created each CONNECTOR.OPTIONS, this can't be modified or deleted by users.  
*   SNJS.codebox.js : [CHANGE] copy "COOKIES", "GET" init-value from CONNECTOR Object. (refer x)
*   SNJS.excute.js : [NEW] Added 'include' function in bulit-in utils(EXPERIMENT)
*   SNJS.excute.js : [NEW] Added 'include_once' function in bulit-in utils(EXPERIMENT)
*   SNJS.excute.js : [NEW] Added 'nodeEval' function in bulit-in utils.
*   SNJS.excute.js : [BUG] Whether 'script.text' was empty or not, it should not affect the PARSED text.
*   SNJS.option.js : [NEW] Attached watch-event to option file. 
*   SNJS.option.js : [NEW] Added "BASE_DIRECTORY" option. - It acts like Root path when using absolute path.
*   SNJS.option.js : [NEW] Added "LOCK_DIRECTORY" option. - This prevent from accessing files outside directory.
*   SNJS.option.js : [NEW] Added "ALLOW_NODEEVAL" option. - Enable to run 'nodeEval' function.
*   demo.snjs.html : [CHANGE] Added new features test. 
*   demo.include.snjs.html : [NEW] to test. 


v0.0.02pa
---------

*   SNJS.excute.js : [NEW] 'ALLOW_CONSOLE' 
*   SNJS.excute.js : [CHANGE] CODEBOX._PARSED type change (array -> object)
*   SNJS.ext.js : [BUG] "NON" -> "_NON"
*   SNJS.collect.js : [CHANGE] argument object ( source -> connector)
*   SNJS.collect.js : [CHANGE] return object ( script -> connector)
*   SNJS.collect.js : [NEW] 'ALLOW_SHARE' 