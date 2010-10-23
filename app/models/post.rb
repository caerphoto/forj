class Post < ActiveRecord::Base
    attr_accessible :content
    belongs_to :user
    belongs_to :reply_user, :class_name => "User"
    belongs_to :msg_thread
end
