module ApplicationHelper

    #Return a default title if none is specified
    def title
        base_title = "FORJ Forum"
        if @title.nil?
            base_title
        else
            "#{@title} - #{base_title}"
        end
    end
end
