class User < ActiveRecord::Base
    # Include default devise modules. Others available are:
    # :token_authenticatable, :confirmable, :lockable and :timeoutable
    devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable


    # Setup accessible (or protected) attributes for your model
    attr_accessible :name, :sig, :email, :password, :password_confirmation,
    :remember_me

    has_many :posts
    validates :email,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
    validates :name,
        :presence => true,
        :uniqueness => { :case_sensitive => false }

    after_create :maybe_admin

    def update_last_read(thread_id, post_count)
        # Read the user's last_read string, then see if the given thread is
        # mentioned in it. If so, update the post_count for it.
        # The last_read string looks like this:
        # "1:33,2:20,3:50,5:11"
        # The digit before the : is the thread_id, the one after is the number
        # of posts in that thread that the user has seen.
        lr = self.last_read || ""
        if lr != ""
            old_count = lr.match /(^|,)#{thread_id}:(\d+)(,|$)/
            last = 0
            last = old_count[2].to_i if old_count
            numposts = MsgThread.find(thread_id).posts.length

            return if last >= numposts

            if last < post_count and old_count
                new_lr = lr.gsub /(^|,)(#{thread_id}):(\d+)(,|$)/,
                    "\\1\\2:#{post_count}\\4"
            else
                new_lr = lr + "," + [thread_id, post_count].join(":")
            end
        else
            new_lr = [thread_id, post_count].join(":")
        end

        self.last_read = new_lr
        self.save
    end

    def to_h_basic
        {
            :name => self.name,
            :sig => self.sig,
            :id => self.id
        }
    end

    def to_h_full user_rank = 0
        # The supplied user_rank should normally be the currently signed in
        # user's rank, which is inaccessible from within this method
        result = self.to_h_basic
        result.merge!(
            :last_login => format_date(self.last_sign_in_at),
            :rank => self.rank)

        # Display more information if the supplied rank is high enough
        if user_rank > 0
            result.merge!({
                :email => self.email,
                :id => self.id
            })
        end
        return result
    end

    private
    def maybe_admin
        # If this is the only user, make it an administrator
        if User.count == 1
            self.rank = 3
            self.save
        else # Otherwise make it a normal user
            self.rank = 1
            self.save
        end
    end
end
