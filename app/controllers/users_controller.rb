def reset_last_read
    # Resets the last_read for all users to blank
    User.all.each do |user|
        user.last_read = ""
        user.save
    end
end

def update_last_read(thread_id, post_count)
    if user_signed_in?
        # Read the user's last_read string, then see if the given thread is
        # mentioned in it. If so, update the post_count for it.
        # The last_read string looks like this:
        # "1:33,2:20,3:50,5:11"
        # The digit before the : is the thread_id, the one after is the number
        # of posts in that thread that the user has seen.
        lr = current_user.last_read
        puts "User's current last_read = '#{lr}'"
        if lr != ""
            old_count = lr.match /(^|,)#{thread_id}:(\d+)(,|$)/
            last = 0
            last = old_count[2].to_i if old_count
            numposts = MsgThread.find(thread_id).posts.length

            puts "Last read for thread #{thread_id} = #{last}"
            puts "post_count parameter = #{post_count}"
            puts "Number of posts in this thread = #{numposts}"

            return if last >= numposts

            puts "Last is not >= numposts"

            if last < post_count and old_count
                new_lr = lr.gsub /(^|,)(#{thread_id}):(\d+)(,|$)/,
                    "\\1\\2:#{post_count}\\4"
            else
                new_lr = lr + "," + [thread_id, post_count].join(":")
            end
        else
            new_lr = [thread_id, post_count].join(":")
        end

        puts "Updating user's last_read with:", new_lr
        current_user.last_read = new_lr
        current_user.save
    end
end

class UsersController < ApplicationController
    # Nothing fancy in here - most actions just return JSON data
    def get_basic_user_details(user)
        unless user.nil?
            result = {
                :name => user.name,
                :id => user.id,
            }
        else
            result = {
                :name => "(unknown)",
                :id => 0,
            }
        end
    end

    def get_full_user_details(user)
        if user.nil?
            return nil
        else
            result = get_basic_user_details(user)
            if current_user.admin?
                result.merge!({
                    :user_type => user.admin? ? "A" : "N",
                    :email => user.email
                })
            end
            return result
        end
    end

    def show
        user = User.find(params[:id])

        result = get_full_user_details(user)

        render :json => result.to_json
    end

    def index
        allusers = User.all :order => "name"

        result = []

        allusers.each do |user|
            result.push get_basic_user_details(user)
        end
        render :json => result.to_json
    end

  def new
  end

end
