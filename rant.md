#Word Processors and Image Editors Rant

This is a semi-rant about image editors and word processors, and how why so many of them persist in doing it wrong. Let's start with word processors&hellip;

###Wrong?
"What's wrong with the way they work now?" you may ask. I'll start with word processors, since I'm currently working on a [web-based one][soda] that is going to work how I think these things ought to work.

The basic problem is that word processors are too focussed on character-level formatting. To make a block of text into something that looks like a heading, the common approach is to select the text, change its size using the Font Size drop-down on the toolbar, then maybe make it bold too, or use a different font family. If you want to change the look of a paragraph, you'd select it, then change its appearance using the usual controls.

This works for documents with one heading and where all the paragraphs have nothing else between them, but what about more complex text (like this one)? To continue the old way you'd have to go through the entire document changing each paragraph or heading individually; Microsoft Word even has a tool to make this process more efficient: the Format Painter. Here's what the [MS Office help page][mshelp] has to say about it:

> Say you've written a report in Word. You like the look, especially your  headings, which are 14 pt. Bookman Old Style, centered, green, and bold, with a nice subtle shadow.

> Fifteen minutes before you're supposed to present the report to the team, your manager asks you to add four new sections to the report. You spend thirteen minutes adding the information, and the next two wishing that you hadn't chosen such complicated formatting for your headings, since you now have to apply it to all the new ones.

> Using Format Painter saves you that time and duplicated effort. Instead of having to manually apply the font, font effects, centered paragraph alignment, and other formatting to each new section heading, you can quickly copy all of the formatting attributes by using one toolbar button.

That's great and all, but it's a case of fixing the symptom, not the cause of the problem, which is that the application encourages users to format text the wrong way.

###Ok then smartypants&hellip;

Any modern web designer knows that an HTML document should be styled with CSS. Gone are the days of `<font>` tags littering the page, and `<body bgcolor=gray>` and the like &ndash; these days we do it the right way by separating content/structure from presentation, with a (normally) external CSS file which contains rules on how document the document should look. This allows an entire site's presentation to be changed by editing a relatively small file dedicated to the purpose.

You can see where I'm going with this. I'm not suggesting word processors should use CSS, or that users should have to edit a separate file in order to format their documents. Rather, I just would like to see the applications make stylesheet-based editing the main way to do things. Not the *only* way, of course: like I said, for very simple documents it's easier to just apply the formatting you want to the text directly, instead of giving the text some structural meaning (heading, normal paragraph, block quote etc.) then editing the style rule for that.

Naturally, many people will reject this idea. It's not what they're used to, they like it how things are, etc. But, for anyone who needs to write a moderately complex document I believe it's by far the better way to work. It lets you concentrate on the content and structure of your document, rather than the superficial appearance. Yes, once you've written your document you could easily spend hours tweaking the style to perfection, but if sensible default styles are provided, or if it's easy to save new ones, this step will be a quick one. This was the thinking behind [Soda] &ndash; good default styles that let you write nice-looking documents in a structured, easy-to-change way.

With Soda, there <del>is</del> will be no font size or font family drop-down on the toolbar. Documents have a base font size (12pt by default), from which other sizes are derived &ndash; level 1 headings, for example, are 150% of the base size. Similarly, you can't change the font family of a block of text except by marking as having some particular meaning (such as *emphasised* or a <cite>citation</cite>), then modifying the rule for text with that meaning.

The idea is to enforce consistency and structure throughout the document: using the example above from the Office help page, if you were using a style-based editor the new headings would automatically match the existing ones. There would be no need to to copy styles, with the possibility of missing one, or applying it incorrectly. You just create a heading, and it looks like all the other headings. 

To continue Microsoft's example, let's say you were asked at the last minute to make all the headings red instead of green. No problem using the Format Painter if you only have one or two headings, but what if this is a 20-page report with 45 or so headings? Changing one style rule is hugely more convenient than having to go through the entire document clicking each heading to change it to the new format.

###But Word can already&hellip;

Yes, yes, I know. You can already use Word (and OpenOffice/LibreOffice, and presumably most other word processors) this way. The point is they don't make it as easy as it should be. Word even comes across to me like it's trying to get you to not use the Styles functionality, as if it'd prefer it if you did things the old-fashioned way.

[soda]: http://soda.heroku.com/
[mshelp]: http://office.microsoft.com/en-us/help/quickly-copy-formatting-with-the-format-painter-HA001054892.aspx

