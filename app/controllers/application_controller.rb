# Common functions accessible to controllers and models:
def create_post thread, post_details
    thread.posts.build(
        :content => post_details[:content],
        :post_index => post_details[:post_index] || 0,
        :reply_index => post_details[:reply_index] || 0,
        :reply_user_id => post_details[:reply_user_id] || 0,
        :user_id => user_signed_in? ? current_user.id : 0
    )
end

def format_date(date)
    date_str = date.strftime(" at %H:%M")

    if date.to_date == Date.today
        date_str = "Today" + date_str
    else
        if date.to_date == Date.today.-(1)
            date_str = "Yesterday" + date_str
        else
            date_str = date.to_date.to_s + date_str
        end
    end
    if date.to_time > Time.now.-(3600)
        minutes = Time.now.min - date.to_time.min
        minutes += 60 if minutes < 0
        return date_str + " (#{minutes} minute#{minutes == 1 ? "" : "s"} ago)"
    elsif date.to_time > Time.now.-(60 * 60 * 24)
        hours = Time.now.hour - date.to_time.hour
        hours += 24 if hours < 0
        return date_str + " (about #{hours} hour#{hours == 1 ? "" : "s"} ago)"
    else
        return date_str
    end
end

class ApplicationController < ActionController::Base
  protect_from_forgery
end
